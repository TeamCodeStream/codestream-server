// handle the "POST /no-auth/provider-deauth" request to deauthorize user's credentials
// for a third-party provider

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class ProviderDeauthRequest extends RestfulRequest {

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
				}
			}
		);
	}

	// clear the credentials for the given provider (in the path) and the given team ID (in the body)
	async clearCredentials () {
		// remove credentials for the given provider and team ID in the user object
		const teamId = this.request.body.teamId.toLowerCase();
		const provider = this.request.params.provider.toLowerCase();
		const op = {
			$unset: {
				[`providerInfo.${teamId}.${provider}`]: true
			},
			$set: {
				modifiedAt: Date.now()
			}
		};
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
			await this.api.services.messager.publish(
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
					teamId: '<ID of team for which to clear credentials>'
				},
			},
			returns: 'Directive to remove credentials'
		};
	}
}

module.exports = ProviderDeauthRequest;
