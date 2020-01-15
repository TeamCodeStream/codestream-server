'use strict';

const AuthenticationTest = require('./authentication_test');
const JSONWebToken = require('jsonwebtoken');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');

class AuthenticationUserNotFoundTest extends AuthenticationTest {

	get description () {
		return 'should prevent access to resources when the user found in the payload of the access token does not exist';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1004'
		};
	}

	// before the test runs...
	async before () {
		await super.before();
		await this.alterUserIdInToken();
	}

	async alterUserIdInToken () {
		// decrypt the token to get payload
		let payload;
		const secret = SecretsConfig.auth;
		try {
			payload = JSONWebToken.verify(this.token, secret);
		}
		catch (error) {
			throw 'invalid token: ' + error;
		}
		// change the user ID and regenerate the token
		payload.uid = 'xxx';
		this.token = JSONWebToken.sign(payload, secret);
	}
}

module.exports = AuthenticationUserNotFoundTest;
