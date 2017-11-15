'use strict';

var AuthenticationTest = require('./authentication_test');
var JSONWebToken = require('jsonwebtoken');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');

class AuthenticationNoUser_IDTest extends AuthenticationTest {

	get description () {
		return 'should prevent access to resources when no userId found in the payload of the access token';
	}

	getExpectedError () {
 		return {
 			code: 'AUTH-1003'
 		};
 	}
	before (callback) {
		this.removeUserIdFromToken(error => {
			if (error) { return callback(error); }
			super.before(callback);
		});
	}

	removeUserIdFromToken (callback) {
		let payload;
		const secret = SecretsConfig.auth;
		try {
			payload = JSONWebToken.verify(this.token, secret);
		}
		catch(error) {
			return callback('invalid token: ' + error);
		}
		payload.uid = payload.userId;
		delete payload.userId;
		this.token = JSONWebToken.sign(payload, secret);
		callback();
	}
}

module.exports = AuthenticationNoUser_IDTest;
