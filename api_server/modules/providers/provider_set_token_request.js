// handle the "POST /provider-set-token" request to set an access token
// for a third-party provider direct from the client

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class ProviderSetTokenRequest extends RestfulRequest {

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
		await this.saveToken();			// save the access token for the user
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['token', 'teamId']
				},
				optional: {
					string: ['host', 'refreshToken', 'apiKey'],
					number: ['expiresIn'],
					object: ['data']
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
	async saveToken () {
		const modifiedAt = Date.now();
		let key = `providerInfo.${this.team.id}.${this.provider}`;
		if (this.request.body.host) {
			const starredHost = this.request.body.host.toLowerCase().replace(/\./g, '*');
			key += `.hosts.${starredHost}`;
		}
		const data = {
			accessToken: this.request.body.token,
			data: this.request.body.data || {}
		};
		if (this.request.body.expiresIn) {
			data.data.expiresIn = this.request.body.expiresIn;
			data.expiresAt = Date.now() + (this.request.body.expiresIn - 5) * 1000;
		}
		['refreshToken', 'apiKey'].forEach(attribute => {
			if (this.request.body[attribute]) {
				data.data[attribute] = this.request.body[attribute];
				data[attribute] = this.request.body[attribute];
			}
		});
		const op = {
			$set:{
				[key]: data,
				modifiedAt
			}
		};

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
			tag: 'provider-set-token',
			summary: 'Set an access token associated with a third-party provider',
			access: 'Access tokens are issued per team, so user must be a member of the team passed with the request',
			description: 'Access tokens to access third-party provider APIs can be optionally set by the user from the client. This call sets the access token, along with any other provided properties.',
			input: {
				summary: 'Specify provider in the path, and teamId and token in the request body, along with optional attributes',
				looksLike: {
					'teamId*': '<ID of the team for which provider access is required>',
					'token*': '<Token to set>',
					'host': '<Provider host, for enterprise installations',
					'refreshToken': '<Optional refresh token, for access tokens that expire>',
					'expiresIn': '<Time until the token expires, in seconds>',
					'data': '<A free-form object containing any additonal data associated with the token>'
				}
			},
			returns: {
				summary: 'Returns a directive indicating how to update the user object with new token data',
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

module.exports = ProviderSetTokenRequest;
