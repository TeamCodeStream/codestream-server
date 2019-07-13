'use strict';

const SetPasswordTest = require('./set_password_test');
const Assert = require('assert');
const Secrets = require(process.env.CS_API_TOP + '/config/secrets');

class UserDeactivatedTest extends SetPasswordTest {

	get description () {
		return 'should redirect with an error if trying to set a password with a token that indicates a deactivated user';
	}

	before (callback) {
		// replace the token with a new one, and remove the email
		super.before(error => {
			if (error) { return callback(error); }
			this.deactivateUser(callback);
		});
	}

	deactivateUser (callback) {
		this.doApiRequest(
			{
				method: 'delete',
				path: '/users/' + this.currentUser.user.id,
				requestOptions: {
					headers: {
						'x-delete-user-secret': Secrets.confirmationCheat
					}
				},
				token: this.token
			},
			callback
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(data, '/web/user/password/reset/invalid', 'redirected to incorrect url');
	}
}

module.exports = UserDeactivatedTest;
