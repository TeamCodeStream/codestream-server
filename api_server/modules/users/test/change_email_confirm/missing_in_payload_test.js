'use strict';

const ChangeEmailConfirmTest = require('./change_email_confirm_test');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');

class MissingInPayloadTest extends ChangeEmailConfirmTest {

	get description () {
		return `should return an error when sending a confirm change of email request with a token that has no ${this.parameter}`;
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	// set the data to use when submitting the request
	setData (callback) {
		// replace the token with a token that has no email in it
		super.setData(() => {
			const tokenHandler = new TokenHandler(this.apiConfig.secrets.auth);
			const payload = tokenHandler.decode(this.data.token);
			delete payload[this.parameter];
			this.data.token = tokenHandler.generate(payload, 'email');
			callback();
		});
	}
}

module.exports = MissingInPayloadTest;
