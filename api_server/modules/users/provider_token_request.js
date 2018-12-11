// handle the "POST /no-auth/provider-token" request to handle result of a user auth through a third-party provider

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const AuthenticatorErrors = require(process.env.CS_API_TOP + '/modules/authenticator/errors');
const Errors = require('./errors');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class ProviderTokenRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
		this.errorHandler.add(AuthenticatorErrors);
	}

	async authorize () {
		// no authorization necessary, authorization is handled by the processing logic
	}

	// process the request...
	async process () {
		this.provider = this.request.params.provider.toLowerCase();
		await this.requireAndAllow();		// require certain parameters, discard unknown parameters
		if (!this.request.query.token) {
			// special allowance for token in the fragment, which we can't access,
			// so send a client script that can 
			return await this.extractTokenFromFragment();
		}
		await this.validateState();			// decode the state token and validate
		await this.getUser();				// get the user initiating the auth request
		await this.getTeam();				// get the team the user is authed with
		await this.saveToken();				// save the provided token
		await this.sendResponse();			// send the response html
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['state']
				},
				optional: {
					string: ['token']
				}
			}
		);
	}

	// special allowance for token in the fragment, which we can't access,
	// so send a client script that can 
	async extractTokenFromFragment () {
		this.response.type('text/html');
		const publicUrl = this.api.config.api.publicApiUrl;
		this.response.send(`
<script>
	var hash = window.location.hash.substr(1);
	var hashObject = hash.split('&').reduce(function (result, item) {
		var parts = item.split('=');
		result[parts[0]] = parts[1];
		return result;
	}, {});
	const token = hashObject.token || '';
	document.location.href = "${publicUrl}/no-auth/provider-token/${this.provider}?state=${this.request.query.state}&token=" + token;
</script>
`
		);
		this.responseHandled = true;
	}

	// decode the state token and validate
	async validateState () {
		const stateToken = this.request.query.state;
		let payload;
		try {
			payload = this.api.services.tokenHandler.verify(stateToken);
		}
		catch (error) {
			const message = typeof error === 'object' ? error.message : error;
			if (message === 'jwt expired') {
				throw this.errorHandler.error('tokenExpired');
			}
			else {
				throw this.errorHandler.error('tokenInvalid', { reason: message });
			}
		}
		if (payload.type !== 'pauth') {
			throw this.errorHandler.error('tokenInvalid', { reason: 'not a provider authorization token' });
		}
		this.userId = payload.userId;
		this.teamId = payload.teamId;
	}

	// get the user initiating the auth request
	async getUser () {
		this.user = await this.data.users.getById(this.userId);
		if (!this.user) {
			throw this.errorHandler.error('notFound', { info: 'user' });
		}
	}

	// get the team the user is authed with
	async getTeam () {
		if (!this.user.hasTeam(this.teamId)) {
			throw this.errorHandler.error('updateAuth', { reason: 'user is not on the indicated team' });			
		}
		this.team = await this.data.teams.getById(this.teamId);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
	}

	// save the provided token for the user
	async saveToken () {
		const op = {
			$set: {
				[`providerInfo.${this.team.id}.${this.provider}`]: {
					accessToken: this.request.query.token
				}
			}
		};

		this.transforms.userUpdate = await new ModelSaver({
			request: this,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// send the response html
	async sendResponse () {
		this.response.type('text/html');
		this.response.send(this.module.afterTrelloAuthHtml);
		this.responseHandled = true;
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
			await this.api.services.messager.publish(
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
			tag: 'provider-token',
			summary: 'Completes the authorization of a third-party provider by storing the resulting token',
			access: 'No authorization needed, authorization is handled by looking at the provided state object',
			description: 'Once third-party authorization is complete, call this request to store the token retrieved by auth against the third-party provider',
			input: {
				summary: 'Specify parmaeters in the query',
				looksLike: {
					'state*': '<State token generate by call to provider-auth>',
					'token': '<Third-party auth token, if not provided, a short script will be returned to retrieve it from the document fragment>'
				}
			},
			returns: 'html text to display when the authorization process is complete',
			publishes: 'directive to update the user object with the appropriate token',
			errors: [
				'parameterRequired',
				'tokenExpired',
				'tokenInvalid',
				'notFound',
				'updateAuth'
			]
		};
	}
}

module.exports = ProviderTokenRequest;
