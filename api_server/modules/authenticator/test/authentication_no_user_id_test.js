'use strict';

var AuthenticationTest = require('./authentication_test');
var JSONWebToken = require('jsonwebtoken');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');

class AuthenticationNoUserIDTest extends AuthenticationTest {

	get description () {
		return 'should prevent access to resources when no userId found in the payload of the access token';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1003'
		};
	}

	// before the test runs...
	before (callback) {
		// remove the user ID fromt he token, then try
		super.before(error => {
			if (error) { return callback(error); }
			this.removeUserIdFromToken(callback);
		});
	}

	// remove the user ID from the token
	removeUserIdFromToken (callback) {
		// decrypt the token to get payload
		let payload;
		const secret = SecretsConfig.auth;
		try {
			payload = JSONWebToken.verify(this.token, secret);
		}
		catch(error) {
			return callback('invalid token: ' + error);
		}
		// take the user ID out of the payload and regenerate the token
		payload.uid = payload.userId;
		delete payload.userId;
		this.token = JSONWebToken.sign(payload, secret);
		callback();
	}
}

module.exports = AuthenticationNoUserIDTest;
