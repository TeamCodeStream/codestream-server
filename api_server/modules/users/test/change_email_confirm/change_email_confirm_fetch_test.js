'use strict';

const ChangeEmailConfirmTest = require('./change_email_confirm_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class ChangeEmailConfirmFetchTest extends ChangeEmailConfirmTest {

	get description () {
		return 'should change the user\'s email when requested with a proper token, assuming the new email has been confirmed, checked by fetching the user\'s me object and confirming the email has changed';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/no-auth/change-email-confirm';
	}

	// run the actual test...
	run (callback) {
		// run the test to send the confirm request, then check the user's me object for the new email
		BoundAsync.series(this, [
			super.run,
			this.checkEmail
		], callback);
	}

	// check that the email has changed by fetching the user's me object
	checkEmail (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/users/me',
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert.equal(response.user.email, this.newEmail, 'fetched user\'s email does not match the new email');
				callback();
			}
		);
	}
}

module.exports = ChangeEmailConfirmFetchTest;
