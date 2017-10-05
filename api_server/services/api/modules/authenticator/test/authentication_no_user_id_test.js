'use strict';

var Authentication_Test = require('./authentication_test');
var JSON_Web_Token = require('jsonwebtoken');
var Secrets_Config = require(process.env.CI_API_TOP + '/config/secrets.js');

const DESCRIPTION = 'should prevent access to resources when no user_id found in the payload of the access token';

class Authentication_No_User_ID_Test extends Authentication_Test {

	get_description () {
		return DESCRIPTION;
	}

	get_expected_error () {
 		return {
 			code: 'AUTH-1003'
 		};
 	}
	before (callback) {
		this.remove_user_id_from_token(() => {
			super.before(callback);
		});
	}

	remove_user_id_from_token (callback) {
		var payload;
		const secret = Secrets_Config.auth;
		try {
			payload = JSON_Web_Token.verify(this.token, secret);
		}
		catch(error) {
			return callback('invalid token: ' + error);
		}
		payload.uid = payload.user_id;
		delete payload.user_id;
		this.token = JSON_Web_Token.sign(payload, secret);
		callback();
	}
}

module.exports = Authentication_No_User_ID_Test;
