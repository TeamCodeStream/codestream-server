'use strict';

const ChangeEmailConfirmTest = require('./change_email_confirm_test');
const TokenHandler = require(process.env.CS_API_TOP + '/server_utils/token_handler');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');
const ObjectID = require('mongodb').ObjectID;

class UserNotFoundTest extends ChangeEmailConfirmTest {

	get description () {
		return 'should return an error when sending a confirm change of email request with a token that has an unknown user ID';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	// set the data to use when submitting the request
	setData (callback) {
		// replace the token with a token with a bogus user ID
		super.setData(() => {
			const tokenHandler = new TokenHandler(SecretsConfig.auth);
			const payload = tokenHandler.decode(this.data.token);
			payload.uid = ObjectID();
			this.data.token = tokenHandler.generate(payload, 'email');
			callback();
		});
	}
}

module.exports = UserNotFoundTest;
