'use strict';

const AuthenticationTest = require('./authentication_test');
const JSONWebToken = require('jsonwebtoken');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');

class MinIssuanceTest extends AuthenticationTest {

	get description () {
		return 'should prevent access to resources when the issuance of an access token precedes the minimum issuance for the user';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1005'
		};
	}

	// before the test runs...
	async before () {
		await super.before();
		await this.alterIssuanceTimeInToken();
	}

	async alterIssuanceTimeInToken () {
		// decrypt the token to get payload
		let payload;
		const secret = SecretsConfig.auth;
		try {
			payload = JSONWebToken.verify(this.token, secret);
		}
		catch (error) {
			throw 'invalid token: ' + error;
		}
		// change the issuance time and regenerate the token
		payload.iat = Math.floor(Date.now() / 1000) - 5 * 60;
		this.token = JSONWebToken.sign(payload, secret);
	}
}

module.exports = MinIssuanceTest;
