'use strict';

const ResetPasswordTest = require('./reset_password_test');
const TokenHandler = require(process.env.CS_API_TOP + '/modules/authenticator/token_handler');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

class NoEmailTest extends ResetPasswordTest {

	constructor (options) {
		super(options);
		this.dontLoginToVerify = true;
	}

	get description () {
		return 'should return an error when sending a reset password request with a token that has no email';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	// set the data to use when resetting password
	setData (callback) {
		// replace the token with a reset token that has no email in it
		super.setData(() => {
			this.passwordData.t = new TokenHandler(SecretsConfig.auth).generate({}, 'rst');
			callback();
		});
	}
}

module.exports = NoEmailTest;
