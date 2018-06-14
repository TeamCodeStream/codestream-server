// handle the "PUT /check_signup" request to check if a signup has occurred associated with the given 
// IDE-generated token

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const AuthenticatorErrors = require(process.env.CS_API_TOP + '/modules/authenticator/errors');
const UserErrors = require('./errors');
const LoginHelper = require('./login_helper');

class CheckSignupRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(UserErrors);
		this.errorHandler.add(AuthenticatorErrors);
	}

	async authorize () {
		// no authorization necessary
	}

	// process the request....
	async process () {
		await this.requireAndAllow();	// require certain parameters, and discard unknown parameters
		await this.findToken();         // look for the signup token provided
		await this.getUser();           // get the user associated with the email in the token
		await this.doLogin();           // perform login functions for this user, now that we've verified the token
		await this.removeSignupToken(); // remove the signup token we found
	}

	// require these parameters, and discard any unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['token']
				}
			}
		);
	}

	async findToken () {
		this.userId = await this.api.services.signupTokens.find(
			this.request.body.token,
			{ requestId: this.request.id }
		);
		if (this.userId === null) {
			throw this.errorHandler.error('noUserId');
		}
		else if (this.userId === false) {
			throw this.errorHandler.error('tokenExpired');
		}
	}

	// get the user associated with the ID
	async getUser () {
		this.user = await this.data.users.getById(this.userId);
		if (!this.user || this.user.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'user' });
		}
		if (!this.user.get('isRegistered')) {
			throw this.errorHandler.error('noLoginUnregistered');
		}
		if ((this.user.get('teamIds') || []).length === 0) {
			throw this.errorHandler.error('userNotOnTeam');
		}
	}

	// return login data (initial data, access token) for this user, so the IDE can jump in immediately
	async doLogin () {
		this.responseData = await new LoginHelper({
			request: this,
			user: this.user,
			loginType: 'web'
		}).login();
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
					pubnubKey: '<key to use for subscribing to PubNub channels>',
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
				'userNotOnTeam'
			]
		};
	}
}

module.exports = CheckSignupRequest;
