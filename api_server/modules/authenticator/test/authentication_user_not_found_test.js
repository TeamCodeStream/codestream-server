'use strict';

var AuthenticationTest = require('./authentication_test');
var JSONWebToken = require('jsonwebtoken');
const ApiConfig = require(process.env.CS_API_TOP + '/config/config');

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
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.alterUserIdInToken(callback);
		});
	}

	alterUserIdInToken (callback) {
		// decrypt the token to get payload
		let payload;
		const secret = ApiConfig.getPreferredConfig().secrets.auth;
		try {
			payload = JSONWebToken.verify(this.token, secret);
		}
		catch(error) {
			return callback('invalid token: ' + error);
		}
		// change the user ID and regenerate the token
		payload.uid = 'xxx';
		this.token = JSONWebToken.sign(payload, secret);
		callback();
	}
}

module.exports = AuthenticationUserNotFoundTest;
