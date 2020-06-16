// handle the "PUT /no-auth/login" request to log a user in, verifying password
// and giving them an access token to use for future requests

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const LoginHelper = require('./login_helper');
const Errors = require('./errors');
const LoginCore = require('./login_core');

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
		await this.requireAndAllow();	// require certain parameters, and discard unknown parameters
		await this.handleLogin();		// handle the actual login check
		await this.doLogin();			// proceed with actual login
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

	// handle the actual login check ... get user and validate password
	async handleLogin () {
		const { email, password } = this.request.body;
		this.user = await new LoginCore({
			request: this
		}).login(email, password);
	}

	// proceed with the actual login, calling into a login helper 
	async doLogin () {
		this.responseData = await new LoginHelper({
			request: this,
			user: this.user,
			loginType: this.loginType,
			trueLogin: true
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
				'passwordMismatch',
				'noLoginUnregistered'
			]
		};
	}
}

module.exports = LoginRequest;
