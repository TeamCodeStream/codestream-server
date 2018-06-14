'use strict';

const ResendConfirmTest = require('./resend_confirm_test');
const Assert = require('assert');

class ValidTokenTest extends ResendConfirmTest {

	get description () {
		return 'when sending a request to resend a confirmation email, the token in the email should work to confirm the user';
	}

	// run the actual test...
	run (callback) {
		// run the test and get the response, but then...
		super.run(error => {
			if (error) { return callback(error); }
			// verify we can use the token to confirm the user
			this.confirmUser(callback);
		});
	}
    
	// attempt to actually confirm the user with the received token
	confirmUser (callback) {
		const userEmail = this.data.email;
		delete this.data;
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/confirm',
				data: {
					token: this.response.confirmationToken
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert(response.user && response.user._id === this.userId, 'returns user ID does not match');
				Assert.equal(response.user.email, userEmail, 'email does not match');
				Assert(response.user.isRegistered, 'isRegisterd not set');
				callback();
			}
		);
	}
}

module.exports = ValidTokenTest;
