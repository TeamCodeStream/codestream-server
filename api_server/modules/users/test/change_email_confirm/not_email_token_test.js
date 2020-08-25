'use strict';

const ChangeEmailConfirmTest = require('./change_email_confirm_test');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');

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
			const tokenHandler = new TokenHandler(this.apiConfig.sharedSecrets.auth);
			const payload = tokenHandler.decode(this.data.token);
			this.data.token = tokenHandler.generate(payload, 'xyz');
			callback();
		});
	}
}

module.exports = NotEmailTokenTest;
