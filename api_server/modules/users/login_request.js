// handle the "PUT /no-auth/login" request to log a user in, verifying password
// and giving them an access token to use for future requests

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const BCrypt = require('bcrypt');
const LoginHelper = require('./login_helper');
const Indexes = require('./indexes');
const Errors = require('./errors');
const { callbackWrap } = require(process.env.CS_API_TOP + '/server_utils/await_utils');

class LoginRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
		this.loginType = this.loginType || 'web';
	}

	async authorize () {
		// no pre-authorization needed, authorization is done according to email and password
	}

	// process the request....
	async process () {
		await this.requireAndAllow();			// require certain parameters, and discard unknown parameters
		await this.getUser();					// get the user indicated by email in the request
		await this.validatePassword();			// validate the given password matches their password hash
		await this.doLogin();					// proceed with actual login
	}

	// require these parameters, and discard any unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['email', 'password']
				}
			}
		);
	}

	// get the user indicated by the passed email
	async getUser () {
		this.user = await this.data.users.getOneByQuery(
			{
				searchableEmail: this.request.body.email.toLowerCase()
			},
			{
				databaseOptions: {
					hint: Indexes.bySearchableEmail
				}
			}
		);
		/*
		// Killing this check to avoid email harvesting vulnerability, instead we'll drop through
		// and return a password mismatch error even if the user doesn't exist
		if (!this.user || this.user.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'email' });
		}
		*/
	}

	// validate that the given password matches the password hash stored for the user
	async validatePassword () {
		let result;
		try {
			if (this.user && !this.user.get('deactivated')) {
				result = await callbackWrap(
					BCrypt.compare,
					this.request.body.password,
					this.user.get('passwordHash')
				);
			}
		}
		catch (error) {
			throw this.errorHandler.error('token', { reason: error });
		}
		if (!result) {
			throw this.errorHandler.error('passwordMismatch');
		}
		if (!this.user.get('isRegistered')) {
			throw this.errorHandler.error('noLoginUnregistered');
		}
	}

	// proceed with the actual login, calling into a login helper 
	async doLogin () {
		this.responseData = await new LoginHelper({
			request: this,
			user: this.user,
			loginType: this.loginType
		}).login();
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'login',
			summary: 'Performs login',
			access: 'No authorization needed, though email and password check are obviously performed',
			description: 'Performs a login for a given user and returns an access token for use with future requests',
			input: {
				summary: 'Specify attributes in the body',
				looksLike: {
					'email*': '<User\'s email>',
					'password*': '<Password to verify>'
				}
			},
			returns: {
				summary: 'Returns an updated user object, plus access token and PubNub subscription key, and teams the user is on as well as repos owned by those teams',
				looksLike: {
					user: '<@@#user object#user@@>',
					accessToken: '<user\'s access token, to be used in future requests>',
					pubnubKey: '<subscribe key to use for connecting to PubNub>',
					pubnubToken: '<user\'s token for subscribing to PubNub channels>',
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
				'passwordMismatch',
				'noLoginUnregistered'
			]
		};
	}
}

module.exports = LoginRequest;
