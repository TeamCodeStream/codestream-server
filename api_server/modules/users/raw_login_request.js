// handle the "PUT /login" request to log a user in, given an access token

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const LoginHelper = require('./login_helper');

class RawLoginRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.loginType = this.loginType || 'web';
	}

	async authorize () {
		// no pre-authorization needed, authorization is done according to the access token
	}

	// process the request....
	async process () {
		this.responseData = await new LoginHelper({
			request: this,
			user: this.request.user,
			loginType: this.loginType
		}).login();
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'rawlogin',
			summary: 'Performs a raw login, requiring only an access token',
			access: 'No authorization needed',
			description: 'Performs a login for a given user as determined by the usual access token; returns the same as a login through email and password',
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
				'noLoginUnregistered'
			]
		};
	}
}

module.exports = RawLoginRequest;
