// handle the "POST /no-auth/provider-deauth" request to deauthorize user's credentials
// for a third-party provider

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class ProviderDeauthRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler = this.module.errorHandler;
	}

	async authorize () {
		// no authorization necessary, this just initiates a redirect to a third-party auth
		// connecting the current user
	}

	// process the request...
	async process () {
		await this.requireAndAllow();		// require certain parameters, discard unknown parameters
		await this.clearCredentials();		// clear the credentials for the provider in question
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['teamId']
				},
				optional: {
					string: ['host', 'subId']
				}
			}
		);
	}

	// clear the credentials for the given provider (in the path) and the given team ID (in the body)
	async clearCredentials () {

		// remove credentials for the given provider and team ID in the user object
		const teamId = this.request.body.teamId.toLowerCase();
		const provider = this.request.params.provider.toLowerCase();
		let { host, subId } = this.request.body;
		let userKey = `providerInfo.${provider}`;
		let teamKey = `providerInfo.${teamId}.${provider}`;
		if (host) {
			host = host.toLowerCase().replace(/\./g, '*');
			userKey += `.hosts.${host}`;
			teamKey += `.hosts.${host}`;
		}
		if (subId) {
			userKey += `.multiple.${subId}`;
			teamKey += `.multiple.${subId}`;
		}

		const existingUserProviderInfo = this.user.getProviderInfo(provider);
		if (
			!host &&
			existingUserProviderInfo &&
			existingUserProviderInfo.hosts &&
			Object.keys(existingUserProviderInfo.hosts).length > 0
		) {
			// if we have enterprise hosts for this provider, don't stomp on them
			userKey += '.accessToken';
		}

		const existingTeamProviderInfo = this.user.getProviderInfo(provider, teamId);
		if (
			!host &&
			existingTeamProviderInfo &&
			existingTeamProviderInfo.hosts &&
			Object.keys(existingTeamProviderInfo.hosts).length > 0
		) {
			// if we have enterprise hosts for this provider, don't stomp on them
			teamKey += '.accessToken';
		}

		const op = {
			$unset: {
				[userKey]: true,
				[teamKey]: true
			},
			$set: {
				modifiedAt: Date.now()
			}
		};

		// this is really only for "sharing model" chat providers, which will provide a subId
		const serviceAuth = this.api.services[`${provider}Auth`];
		if (
			serviceAuth &&
			subId &&
			existingTeamProviderInfo &&
			existingTeamProviderInfo.multiple
		) {
			const providerUserId = await serviceAuth.getUserId(existingTeamProviderInfo.multiple[subId]);
			if (providerUserId) {
				const identity = `${provider}::${providerUserId}`;
				if ((this.user.get('providerIdentities') || []).find(id => id === identity)) {
					op.$pull = { providerIdentities: identity };
				}
			}
		}

		this.transforms.userUpdate = await new ModelSaver({
			request: this,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// handle the request response 
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}
		this.responseData = {
			user: Object.assign({ id: this.user.id }, this.transforms.userUpdate)
		};
		await super.handleResponse();
	}

	// after a response is returned....
	async postProcess () {
		const message = Object.assign({}, this.responseData, { requestId: this.request.id });
		const channel = `user-${this.user.id}`;
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish user update to user ${this.user.id}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'provider-deauth',
			summary: 'Clears user credentials for a particular team and particular third-party provider',
			access: 'No authorization needed, action applies to current authenticated user',
			description: 'Clears user credentials for a particular team and particular third-party provider',
			input: {
				summary: 'Specify the teamId in the body',
				looksLike: {
					'teamId*': '<ID of team for which to clear credentials>',
					'host': '<For enterprise providers, specify the specific host credentials to clear>',
					'subId': '<For credentials issued per workspace or organziation, remove only credentials for this ID>'
				},
			},
			returns: 'Directive to remove credentials'
		};
	}
}

module.exports = ProviderDeauthRequest;
