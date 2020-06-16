'use strict';

const ChangeEmailConfirmTest = require('./change_email_confirm_test');

class TokenRequiredTest extends ChangeEmailConfirmTest {

	get description () {
		return 'should return an error when sending a confirm change of email request without providing a token';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'token'
		};
	}

	// set the data to use when submitting the request
	setData (callback) {
		// delete the token
		super.setData(() => {
			delete this.data.token;
			callback();
		});
	}
}

module.exports = TokenRequiredTest;
