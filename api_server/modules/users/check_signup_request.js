// handle the "PUT /check_signup" request to check if a signup has occurred associated with the given 
// IDE-generated token

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const AuthenticatorErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');
const ProviderErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/providers/errors');
const UserErrors = require('./errors');
const LoginHelper = require('./login_helper');

class CheckSignupRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(UserErrors);
		this.errorHandler.add(AuthenticatorErrors);
		this.errorHandler.add(ProviderErrors);
		this.loginType = this.loginType || 'web';
	}

	async authorize () {
		// no authorization necessary
	}

	// process the request....
	async process () {
		await this.requireAndAllow();	// require certain parameters, and discard unknown parameters
		try {
			await this.findToken();			// look for the signup token provided
			await this.getUser();			// get the user associated with the email in the token
			await this.doLogin();			// perform login functions for this user, now that we've verified the token
			await this.removeSignupToken();	// remove the signup token we found
		}
		catch (error) {
			await this.removeSignupToken();
			throw (error);
		}
	}

	// require these parameters, and discard any unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['token']
				},
				optional: {
					number: ['nrAccountId']
				}
			}
		);
	}

	async findToken () {
		this.signupToken = await this.api.services.signupTokens.find(
			this.request.body.token,
			{ requestId: this.request.id }
		);
		if (!this.signupToken) {
			throw this.errorHandler.error('tokenNotFound');
		}
		else if (this.signupToken.error) {
			if (this.signupToken.sharing) {
				throw this.errorHandler.errorByCode(this.signupToken.error, {
					providerError: this.signupToken.providerError,
					provider: this.signupToken.provider
				});
			}
			else {
				throw this.errorHandler.error('providerLoginFailed', {
					error: this.signupToken.sharing ? this.signupToken.providerError : this.signupToken.error,
					provider: this.signupToken.provider
				});
			}
		}
		else if (this.signupToken.expired) {
			throw this.errorHandler.error('tokenExpired');
		}
	}

	// get the user associated with the ID
	async getUser () {
		this.user = await this.data.users.getById(this.signupToken.userId);
		if (!this.user || this.user.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'user' });
		}
		else if (!this.user.get('isRegistered')) {
			throw this.errorHandler.error('noLoginUnregistered');
		}
	}

	// return login data (initial data, access token) for this user, so the IDE can jump in immediately
	async doLogin () {
		this.responseData = await new LoginHelper({
			request: this,
			user: this.user,
			loginType: this.loginType,
			trueLogin: !this.signupToken.provider || this.signupToken.teamId,
			nrAccountId: this.request.body.nrAccountId
		}).login();
		this.responseData.signupStatus = this.signupToken.signupStatus;
		this.responseData.provider = this.signupToken.provider;
		this.responseData.providerAccess = this.signupToken.providerAccess;
		this.responseData.teamId = this.signupToken.teamId;
	}

	// remove the signup token we were given, signup using this token is no longer valid
	async removeSignupToken () {
		await this.api.services.signupTokens.remove(this.request.body.token, { requestId: this.request.id });
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'check-signup',
			summary: 'Check for a legitimate signup from the web, corresponding to the passed client-issued token',
			access: 'No standard access rules',
			description: 'Use this API to check that a client-issued token issued for web signup has resulted in a valid signup; if so, return data as if a login has been performed',
			input: {
				summary: 'Specify the client-issued token in the request body',
				looksLike: {
					'token*': '<Client-issued signup token>'
				}
			},
			returns: {
				summary: 'Returns an updated user object, plus access token and PubNub subscription key, and teams the user is on as well as repos owned by those teams',
				looksLike: {
					user: '<@@#user object#user@@>',
					accessToken: '<user\'s access token, to be used in future requests>',
					pubnubKey: '<subscribe key to use for connecting to PubNub>',
					pubnubToken: '<user\'s token for subscribing to PubNub channels>',
					providers: '<info structures with available third-party providers>',
					broadcasterToken: '<user\'s token for subscribing to real-time messaging channels>',
					teams: [
						'<@@#team object#team@@>',
						'...'
					],
					repos: [
						'<@@#repo object#repo@@>',
						'...'
					]
				}
			},
			errors: [
				'parameterRequired',
				'tokenInvalid',
				'tokenExpired',
				'notFound',
				'userNotOnTeam',
				'providerLoginFailed',
				'duplicateProviderAuth'
			]
		};
	}
}

module.exports = CheckSignupRequest;
