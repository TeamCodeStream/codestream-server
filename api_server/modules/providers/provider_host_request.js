// handle the "PUT /provider-host" request to set a provider host for a given third-party provider

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class ProviderHostRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler = this.module.errorHandler;
	}

	async authorize () {
		// user must be a member of the team
		const teamId = this.request.params.teamId.toLowerCase();
		this.team = await this.data.teams.getById(teamId);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
		if (!this.user.hasTeam(this.team.id)) {
			throw this.errorHandler.error('updateAuth', { reason: 'user must be a member of the team' });
		}
	}

	// process the request
	async process () {
		await this.requireAndAllow();	// require parameters, and filter out unknown parameters
		await this.setProviderHost();	// set the provider host for the team
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['host']
				},
				optional: {
					string: ['appClientId', 'appClientSecret', 'apiKey'],
					object: ['oauthData']
				}
			}
		);
	}

	// process the request...
	async setProviderHost () {
		// make sure we know about this provider
		const provider = this.request.params.provider.toLowerCase();
		const serviceAuth = this.api.services[`${provider}Auth`];
		if (!serviceAuth) {
			throw this.errorHandler.error('unknownProvider', { info: provider });
		}

		const now = Date.now();
		const host = this.request.body.host.toLowerCase();
		const starredHost = host.replace(/\./g, '*');
		const data = Object.assign({}, this.request.body);
		delete data.host;
		const setKey = `providerHosts.${provider}.${starredHost}`;
		const op = {
			$set: {
				modifiedAt: now,
				[setKey]: data 
			}
		};

		this.updateOp = await new ModelSaver({
			request: this,
			collection: this.data.teams,
			id: this.team.id
		}).save(op);

		const instances = serviceAuth.getInstancesByConfig({
			[starredHost]: {
				oauthData: data.oauthData
			}
		});
		this.responseData = {
			team: {
				id: this.team.id,
				_id: this.team.id,	// DEPRECATE ME
				$set: {
					modifiedAt: now,
					[`providerHosts.${starredHost}`]: instances[0]
				},
			},
			providerId: starredHost
		};
	}

	// handle returning the response
	async handleResponse () {
		if (this.gotError) {
			return await super.handleResponse();
		}
		this.responseData.team.$set.version = this.updateOp.$set.version;
		this.responseData.team.$version = this.updateOp.$version;
		await super.handleResponse();
	}

	// after the response is returned....
	async postProcess () {
		// send the message to the team channel
		const channel = 'team-' + this.team.id;
		const message = Object.assign({}, this.responseData, { requestId: this.request.id });
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`Unable to publish provider host message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'provider-host',
			summary: 'Set the attributes for a third-party provider host for the given team',
			access: 'Only a member of the team can set a provider host',
			description: 'For connecting to on-prem third-party integration providers, or for providers that have per-team provider settings, set the attributes needed to connect to the third-party provider host',
			input: {
				summary: 'Specify the provider and the team ID in the path, and host and other attributes in the request body.',
				looksLike: {
					'host*': '<Host (domain or IP) of the provider>',
					appClientId: '<Client ID to use to connect, where applicable>',
					appClientSecret: '<Client secret to use to connect, where applicable>',
					apiKey: '<API key to use to connect, where applicable (trello)>'
				}
			},
			returns: {
				summary: 'A team object, with directives appropriate for updating the team\'s providerHosts attribute',
				looksLike: {
					team: {
						id: '<ID of the team>',
						$set: '<$set directive to update providerHosts>'
					}
				}
			},
			publishes: {
				summary: 'Publishes a team object, with directives corresponding to the request body passed in, to the team channel, indicating how the providerHosts object for the team object should be updated.',
				looksLike: {
					team: {
						id: '<ID of the team>',
						$set: '<$set directive to update providerHosts>'
					}
				}
			},
			errors: [
				'notFound',
				'updateAuth',
				'unknownProvider'
			]
		};
	}
}

module.exports = ProviderHostRequest;
