'use strict';

const ResendConfirmTest = require('./resend_confirm_test');
const Assert = require('assert');

class OriginalTokenDeprecatedTest extends ResendConfirmTest {

	get description () {
		return 'when sending a request to resend a confirmation email, the original confirmation token should become deprecated';
	}

	// run the actual test...
	run (callback) {
		// run the test and get the response, but then...
		super.run(error => {
			if (error) { return callback(error); }
			// verify we FAIL to use the original token
			this.confirmUser(callback);
		});
	}
    
	// attempt to actually confirm the user with the received token
	confirmUser (callback) {
		delete this.data;
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/confirm',
				data: {
					token: this.originalToken
				}
			},
			(error, response) => {
				Assert(error, 'error expected');
				Assert(response.code === 'AUTH-1002', 'response error code expected to be AUTH-1002');
				callback();
			}
		);
	}
}

module.exports = OriginalTokenDeprecatedTest;
