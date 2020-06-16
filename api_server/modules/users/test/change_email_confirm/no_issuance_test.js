'use strict';

const ChangeEmailConfirmTest = require('./change_email_confirm_test');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');

class NoIssuanceTest extends ChangeEmailConfirmTest {

	get description () {
		return 'should return an error when sending a confirm change of email request with a token for a user that was not actually issued an email token';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	setOptions () {
		super.setOptions();
		this.userOptions.numRegistered = 2;
	}

	// set the data to use when submitting the request
	setData (callback) {
		// replace the token with an email token that has the other user's ID in it
		super.setData(() => {
			const tokenHandler = new TokenHandler(this.apiConfig.secrets.auth);
			const payload = tokenHandler.decode(this.data.token);
			payload.uid = this.users[1].user.id;
			this.data.token = tokenHandler.generate(payload, 'email');
			callback();
		});
	}
}

module.exports = NoIssuanceTest;
