'use strict';

const ChangeEmailConfirmTest = require('./change_email_confirm_test');
const TokenHandler = require(process.env.CS_API_TOP + '/modules/authenticator/token_handler');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

class NotEmailTokenTest extends ChangeEmailConfirmTest {

	get description () {
		return 'should return an error when sending a confirm change of email request with a token that is not an email token';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	// set the data to use when submitting the request
	setData (callback) {
		// replace the token with a token with a bogus type
		super.setData(() => {
			const tokenHandler = new TokenHandler(SecretsConfig.auth);
			const payload = tokenHandler.decode(this.data.token);
			this.data.token = tokenHandler.generate(payload, 'xyz');
			callback();
		});
	}
}

module.exports = NotEmailTokenTest;
