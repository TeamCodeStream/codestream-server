'use strict';

const ChangeEmailTest = require('./change_email_test');
const Assert = require('assert');

class FetchTest extends ChangeEmailTest {

	get description () {
		return 'should change a user\'s email across environments when requested, checked by fetching the user';
	}

	run (callback) {
		super.run(error => {
			if (error) { return callback(error); }
			this.fetchUser(callback);
		});
	}

	fetchUser (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/users/me',
				token: this.currentUser.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert.strictEqual(response.user.email, this.data.toEmail, 'email was not changed');
				callback();
			}
		)
	}
}

module.exports = FetchTest;
