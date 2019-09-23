// handle the "POST /no-auth/provider-action/:provider" request to handle a user action
// initiated for a particular provider

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const ProviderDisplayNames = require(process.env.CS_API_TOP + '/modules/web/provider_display_names');
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');

const CODE_PROVIDERS = {
	github: 'GitHub',
	gitlab: 'GitLab',
	bitBucket: 'Bitbucket',
	'azure-devops': 'Azure DevOps',
	vsts: 'Azure DevOps'
};
	
class ProviderActionRequest extends RestfulRequest {

	async authorize () {
		// no authorization necessary, authorization is handled by the processing logic
	}

	// process the request...
	async process () {
		this.provider = this.request.params.provider.toLowerCase();

		await this.requireAndAllow();	// require certain parameters, discard unknown parameters

		this.parseActionInfo() && 	// parse the action info within the payload
		await this.getUser() &&		// get the user that initiated this action
		await this.getTeam() &&		// get the team the user is on, matching the identity
		await this.getCompany() &&	// get the company the team belongs to
		await this.sendTelemetry();	// send telemetry for this action
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					object: ['payload']
				}
			}
		);
	}

	// parse the action info within the given payload
	parseActionInfo () {
		const action_id = this.request.body.payload.actions &&
			this.request.body.payload.actions[0] &&
			this.request.body.payload.actions[0].action_id;
		if (!action_id) {
			this.log(`Could not find action_id within the ${this.provider} payload`);
			return false;
		}

		try {
			this.actionPayload = JSON.parse(action_id);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.log(`Unable to parse action_id sent with ${this.provider} payload: ${message}`);
			return false;
		}
		return true;
	}

	// get the user that initiated this action
	async getUser () {
		this.providerUserId = this.request.body.payload.user &&
			this.request.body.payload.user.id;
		if (!this.providerUserId) {
			this.log(`${this.provider} did not give a user ID in action payload`);
			return false;
		}

		const users = await this.data.users.getByQuery(
			{ providerIdentities: `${this.provider}::${this.providerUserId}` },
			{ hint: UserIndexes.byProviderIdentities } 
		);
		if (users.length > 1) {
			// this shouldn't really happen
			this.log(`Multiple CodeStream users found matching ${this.provider} identity ${this.providerUserId}`);
			return false;
		}
		if (users.length === 1) {
			this.user = users[0];
		}
		return true;
	}

	// get the team the user is on, matching the identity
	async getTeam () {
		const teamId = this.actionPayload.teamId;
		if (!teamId) {
			this.log(`Could not find teamId within the ${this.provider} action payload`);
			return false;
		} 
		if (this.user && !this.user.hasTeam(teamId)) {
			this.log(`User is not a member of the team provided in ${this.provider} action payload`);
			return false;
		}
		this.team = await this.data.teams.getById(teamId);
		if (!this.team) {
			this.log(`Team not found, as provided in ${this.provider} action payload`);
			return false;
		}
		return true;
	}

	// get the company that owns the team
	async getCompany () {
		this.company = await this.data.companies.getById(this.team.get('companyId'));
		return true;	// we'll tolerate not being able to find the company, though it would be weird....
	}

	// send telemetry event associated with this action
	async sendTelemetry () {
		const info = this.getTrackingInfo();
		if (!info) {
			this.log(`Could not get tracking info from ${this.provider} payload`);
			return false;
		}

		const provider = this.provider === 'slack' ? 'Slack' :
			this.provider === 'msteams' ? 'MSTeams' : this.provider;
		const trackObject = {
			'distinct_id': this.user ? this.user.id : this.providerUserId,
			'Team ID': this.team.id,
			'Team Name': this.team.get('name'),
			'Company Name': this.company ? this.company.get('name') : '',
			'Team Size': this.team.get('memberIds').length,
			'Provider': provider,
			'Endpoint': provider
		};
		if (this.user) {
			Object.assign(trackObject, {
				'email': this.user.get('email'),
				'Join Method': this.user.get('joinMethod')
			});
			if (this.user.get('registeredAt')) {
				trackObject['createdAt'] = new Date(this.user.get('registeredAt')).toISOString();
			}
			if (this.user.get('lastPostCreatedAt')) {
				trackObject['Date of Last Post'] = new Date(this.user.get('lastPostCreatedAt')).toISOString();
			}
		}
		Object.assign(trackObject, info.data);

		this.api.services.analytics.track(
			info.event,
			trackObject,
			{
				request: this,
				user: this.user
			}
		);
	}

	// get the tracking info associated with this requset 
	getTrackingInfo () {
		if (this.actionPayload.linkType === 'web') {
			return {
				event: 'Opened on Web'
			};
		} 
		else if (this.actionPayload.linkType === 'ide') {
			return {
				event: 'Opened in IDE'
			};
		}
		else if (this.actionPayload.linkType === 'external') {
			if (this.actionPayload.externalType === 'code') {
				return {
					event: 'Opened Code',
					data: {
						Host: CODE_PROVIDERS[this.actionPayload.externalProvider] || ''
					}
				};
			}
			else if (this.actionPayload.externalType === 'issue') {
				return {
					event: 'Opened Issue',
					data: {
						Service: ProviderDisplayNames[this.actionPayload.externalProvider] || ''
					}
				};
			}
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'provider-action',
			summary: 'Callback indicating a user action within a provider rendering of a post',
			access: 'No authorization needed',
			description: 'Provides a callback for whenever a user takes an action within a provider\'s rich rendering of a post',
			input: {
				summary: 'Specify payload in the body',
				looksLike: {
					'provider*': '<Payload object>'
				}
			},
			returns: 'Empty object',
			errors: [
				'parameterRequired',
			]
		};
	}
}

module.exports = ProviderActionRequest;
