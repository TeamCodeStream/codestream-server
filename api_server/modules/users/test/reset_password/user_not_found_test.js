'use strict';

const ResetPasswordTest = require('./reset_password_test');
const TokenHandler = require(process.env.CS_API_TOP + '/modules/authenticator/token_handler');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

class UserNotFoundTest extends ResetPasswordTest {

	constructor (options) {
		super(options);
		this.dontLoginToVerify = true;
	}

	get description () {
		return 'should return an error when sending a reset password request with a token that has an unknown email';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	// set the data to use when resetting password
	setData (callback) {
		super.setData(() => {
			// replace the token with a reset token for a non-existent user
			const email = this.userFactory.randomEmail();
			this.passwordData.t = new TokenHandler(SecretsConfig.auth).generate({ email }, 'rst');
			callback();
		});
	}
}

module.exports = UserNotFoundTest;
