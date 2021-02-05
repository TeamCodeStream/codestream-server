// handle the "PUT /provider-info" request to set miscellaneous provider info
// for a third-party provider direct from the client

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

class ProviderInfoRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler = this.module.errorHandler;
	}

	async authorize () {
		// user must be a member of the team
		this.teamId = this.request.body.teamId;
		if (!this.teamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		this.teamId = this.teamId.toLowerCase();
		if (!this.user.hasTeam(this.teamId)) {
			throw this.errorHandler.error('updateAuth', { reason: 'user must be a member of the team' });
		}
	}

	// process the request...
	async process () {
		// get the provider service corresponding to the passed provider
		this.provider = this.request.params.provider.toLowerCase();
		this.serviceAuth = this.api.services[`${this.provider}Auth`];
		if (!this.serviceAuth) {
			throw this.errorHandler.error('unknownProvider', { info: this.provider });
		}

		await this.requireAndAllow();	// require certain parameters, discard unknown parameters
		await this.getTeam();			// get the team the user is auth'd with
		await this.saveInfo();			// save the provider info data for the user
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['teamId'],
					object: ['data']
				},
				optional: {
					string: ['host']
				}
			}
		);
	}

	// get the team the user is authed with
	async getTeam () {
		this.team = await this.data.teams.getById(this.teamId);
		if (!this.team || this.team.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
	}

	// save the provided token for the user
	async saveInfo () {
		const modifiedAt = Date.now();

		// if the user has credentials above the team level (as in, they used the provider for sign-in),
		// ignore the team parameter and set the data at that level
		let key;
		if (
			(this.user.get('providerInfo') || {})[this.provider] &&
			(this.user.get('providerInfo') || {})[this.provider].accessToken
		) {
			key = `providerInfo.${this.provider}`;
		} else {
			key = `providerInfo.${this.team.id}.${this.provider}`;
			if (this.request.body.host) {
				const starredHost = this.request.body.host.toLowerCase().replace(/\./g, '*');
				key += `.hosts.${starredHost}`;
			}
		}

		const op = {
			$set: {
				modifiedAt
			}
		};

		op.$set[`${key}.isApiToken`] = true;
		Object.keys(this.request.body.data).forEach(dataKey => {
			op.$set[`${key}.${dataKey}`] = this.request.body.data[dataKey];
			if (dataKey === 'accessToken') {
				op.$unset = {
					[`${key}.tokenError`]: true
				};
			}
		});

		this.transforms.userUpdate = await new ModelSaver({
			request: this,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// handle the response to the request
	async handleResponse () {
		// the response will be the user update, with an update of the token data
		if (this.gotError) {
			return super.handleResponse();
		}
		this.responseData = { user: this.transforms.userUpdate };
		await super.handleResponse();
	}

	// after a response is returned....
	async postProcess () {
		if (!this.user) { return; }
		await this.publishUserToSelf();
	}

	// publish updated user to themselves, to propagate the new token
	async publishUserToSelf () {
		const data = {
			user: Object.assign(
				{
					id: this.user.id
				},
				this.transforms.userUpdate
			),
			requestId: this.request.id
		};
		const channel = `user-${this.user.id}`;
		try {
			await this.api.services.broadcaster.publish(
				data,
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
			tag: 'provider-info',
			summary: 'Set miscellaneous info associated with a third-party provider',
			access: 'Provider info data is associated with a team, so user must be a member of the team passed with the request',
			description: 'Miscellaneous info associated with a given provider can be set for the client for configuration. This call sets the arbitrary data, putting it in the "data" attribute of the providerInfo structure for the given team and provider.',
			input: {
				summary: 'Specify provider in the path, and teamId and data in the request body',
				looksLike: {
					'teamId*': '<ID of the team for which provider access is required>',
					'data*': '<Hash of data to set>',
					'host': '<Provider host, for enterprise installations',
				}
			},
			returns: {
				summary: 'Returns a directive indicating how to update the user object with new provider info data',
				looksLike: {
					user: '<user directive>'
				}
			},
			errors: [
				'updateAuth',
				'parameterRequired',
				'unknownProvider',
				'notFound'
			]
		};
	}
}

module.exports = ProviderInfoRequest;
