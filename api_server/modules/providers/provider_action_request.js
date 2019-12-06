// handle the "POST /no-auth/provider-action/:provider" request to handle a user action
// initiated for a particular provider

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP +
	'/lib/util/restful/restful_request.js');
const ProviderDisplayNames = require(process.env.CS_API_TOP +
	'/modules/web/provider_display_names');
const SlackInteractiveComponentsHandler = require('./slack_interactive_components_handler');
const SlackCfg = require(process.env.CS_API_TOP + '/config/slack');
const crypto = require('crypto');

const CODE_PROVIDERS = {
	github: 'GitHub',
	gitlab: 'GitLab',
	bitBucket: 'Bitbucket',
	'azure-devops': 'Azure DevOps',
	vsts: 'Azure DevOps'
};

class ProviderActionRequest extends RestfulRequest {
	async authorize() {
		if (!this.verifySlackRequest(this.request, this.request.body.payloadRaw)) {
			this.log('Slack verification failed');
			throw this.errorHandler.error('notFound');
		}
		// in the success case we don't need this anymore and requireAndAllow will warn for it
		delete this.request.body.payloadRaw;
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow() {
		await this.requireAllowParameters('body', {
			required: {
				object: ['payload']
			}
		});
	}

	// process the request...
	async process() {
		this.provider = this.request.params.provider.toLowerCase();
		if (this.provider === 'slack') {
			await this.requireAndAllow(); // require certain parameters, discard unknown parameters
			const data = this.parseSlackActionInfo();
			if (data) {
				const handler = new SlackInteractiveComponentsHandler(
					this,
					data
				);
				const results = await handler.process();
				if (results) {
					if (results.postProcessFn) {
						this.postProcessAwaitable = results.postProcessFn;
					}
					if (results.responseData) {
						this.responseData = results.responseData;
					}
					if (results.actionTeam) {
						const company = await this.getCompany(
							results.actionTeam
						);
						await this.sendTelemetry(
							data,
							results.actionUser,
							results.payloadUserId,
							results.actionTeam,
							company,
							results.hasError
						);
					}
				}
			}
		}
		else if (this.provider === 'msteams') {
			// this.responseData = { 'ok': true };
		}
	}

	verifySlackRequest(request, rawBody) {
		// mainly snagged from https://medium.com/@rajat_sriv/verifying-requests-from-slack-using-node-js-69a8b771b704
		try {
			if (!request.body || !rawBody || !request.body.payload) return false;

			const apiAppId = request.body.payload.api_app_id;
			if (!apiAppId) return false;

			const slackSigningSecret = SlackCfg.signingSecretsByAppIds[apiAppId];
			if (!slackSigningSecret) {
				this.api.log(`Could not find signingSecret for appId=${apiAppId}`);
				return false;
			}

			const slackSignature = request.headers['x-slack-signature'];
			const timestamp = request.headers['x-slack-request-timestamp'];
			if (!slackSignature || !timestamp) return false;

			// protect against replay attacks
			const time = Math.floor(new Date().getTime() / 1000);
			if (Math.abs(time - timestamp) > 300) return false;

			const mySignature = 'v0=' +
				crypto.createHmac('sha256', slackSigningSecret)
					.update('v0:' + timestamp + ':' + rawBody, 'utf8')
					.digest('hex');

			return crypto.timingSafeEqual(
				Buffer.from(mySignature, 'utf8'),
				Buffer.from(slackSignature, 'utf8'));
		}
		catch (ex) {
			this.api.log(`verifySlackRequest error. ${ex}`);
		}
		return false;
	}

	// parse the action info within the given payload
	parseSlackActionInfo() {
		const payload = this.request.body.payload;

		let actionPayload;
		let actionOrCallbackId =
			payload.actions &&
			payload.actions[0] &&
			payload.actions[0].action_id;
		if (!actionOrCallbackId) {
			actionOrCallbackId = payload.view && payload.view.private_metadata;
		}
		if (!actionOrCallbackId) {
			this.log(
				`Could not find action_id within the ${this.provider} payload`
			);
			return undefined;
		}

		try {
			actionPayload = JSON.parse(actionOrCallbackId);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : JSON.stringify(error);
			this.log(
				`Unable to parse action_id sent with ${this.provider} payload: ${message}`
			);
			return undefined;
		}
		return {
			payload: payload,
			actionPayload: actionPayload
		};
	}

	// get the company that owns the team
	async getCompany(team) {
		return await this.data.companies.getById(team.get('companyId'));
	}

	// send telemetry event associated with this action
	async sendTelemetry(data, user, providerUserId, team, company, hasError) {
		if (!data || !data.actionPayload || (!user && !providerUserId) || !team) return;
		const provider =
			this.provider === 'slack'
				? 'Slack'
				: this.provider === 'msteams'
					? 'MSTeams'
					: this.provider;

		const info = this.getTrackingInfo(data.payload, data.actionPayload, provider, hasError);
		if (!info) {
			this.log(
				`Could not get tracking info from ${this.provider} payload`
			);
			return false;
		}

		const trackData = {
			Provider: provider,
			Endpoint: provider
		};
		if (!user) {
			trackData.distinct_id = providerUserId;
		}

		Object.assign(trackData, info.data);
		this.api.services.analytics.trackWithSuperProperties(
			info.event,
			trackData,
			{
				request: this,
				user: user,
				team: team,
				company: company,
				userId: !user && providerUserId
			}
		);
	}

	// get the tracking info associated with this requset
	getTrackingInfo(payload, actionPayload, provider, hasError) {
		if (hasError) {
			return {
				event: 'Provider Reply Denied',
				data: {
					Endpoint: provider || ''
				}
			};
		}
		else if (payload && payload.type === 'view_submission') {
			return {
				event: 'Replied to Codemark',
				data: {
					CodemarkId: actionPayload && actionPayload.cId,
					Endpoint: provider || ''
				}
			};
		}
		else if (actionPayload.linkType === 'web') {
			return {
				event: 'Opened on Web'
			};
		} else if (actionPayload.linkType === 'ide') {
			return {
				event: 'Opened in IDE'
			};
		} else if (actionPayload.linkType === 'reply') {
			return {
				event: 'View Discussion & Reply',
				data: {
					Endpoint: provider || ''
				}
			};
		} else if (actionPayload.linkType === 'external') {
			if (actionPayload.externalType === 'code') {
				return {
					event: 'Opened Code',
					data: {
						Host:
							CODE_PROVIDERS[actionPayload.externalProvider || actionPayload.eP] || ''
					}
				};
			} else if (actionPayload.externalType === 'issue') {
				return {
					event: 'Opened Issue',
					data: {
						Service:
							ProviderDisplayNames[actionPayload.externalProvider || actionPayload.eP] || ''
					}
				};
			}
		}
	}

	async postProcess() {
		if (this.postProcessAwaitable) {
			await this.postProcessAwaitable();
		}
	}

	// describe this route for help
	static describe() {
		return {
			tag: 'provider-action',
			summary:
				'Callback indicating a user action within a provider rendering of a post',
			access: 'No authorization needed',
			description: 'Provides a callback for whenever a user takes an action within a provider\'s rich rendering of a post',
			input: {
				summary: 'Specify payload in the body',
				looksLike: {
					'provider*': '<Payload object>'
				}
			},
			returns: 'Empty object',
			errors: ['parameterRequired']
		};
	}
}

module.exports = ProviderActionRequest;
