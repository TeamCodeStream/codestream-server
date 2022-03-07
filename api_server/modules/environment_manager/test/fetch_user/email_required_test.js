'use strict';

const FetchUserTest = require('./fetch_user_test');

class EmailRequiredTest extends FetchUserTest {

	get description () {
		return 'should return an error when submitting a request to fetch a user without providing an email';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'email'
		};
	}

	// before the test runs...
	before (callback) {
		// delete the email from the url
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/xenv/fetch-user';
			callback();
		});
	}
}

module.exports = EmailRequiredTest;
