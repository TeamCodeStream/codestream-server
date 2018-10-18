'use strict';

const ResetPasswordTest = require('./reset_password_test');
const TokenHandler = require(process.env.CS_API_TOP + '/modules/authenticator/token_handler');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

class NoIssuanceTest extends ResetPasswordTest {

	constructor (options) {
		super(options);
		this.dontLoginToVerify = true;
		this.userOptions.numRegistered = 2;
	}

	get description () {
		return 'should return an error when sending a reset password request with a token for a user that was not actually issued a reset token';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	// set the data to use when resetting password
	setData (callback) {
		// replace the token with a reset token that has the other user's email in it
		super.setData(() => {
			this.passwordData.token = new TokenHandler(SecretsConfig.auth).generate({ email: this.users[1].email }, 'rst');
			callback();
		});
	}
}

module.exports = NoIssuanceTest;
