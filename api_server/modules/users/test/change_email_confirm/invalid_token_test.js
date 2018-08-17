'use strict';

const ChangeEmailConfirmTest = require('./change_email_confirm_test');

class InvalidTokenTest extends ChangeEmailConfirmTest {

	get description () {
		return 'should return an error when sending a confirm change of email request with a totally invalid token string';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	// set the data to use when submitting the request
	setData (callback) {
		super.setData(() => {
			// replace the token with a garbage token
			this.data.token = 'abcxyz';
			callback();
		});
	}
}

module.exports = InvalidTokenTest;
