'use strict';

const FetchUserTest = require('./fetch_user_test');

class FetchByIdTest extends FetchUserTest {

	get description () {
		return 'should be able to fetch a user across environments by ID';
	}

	// before the test runs...
	before (callback) {
		// get the user by ID instead of email
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/xenv/fetch-user?id=' + this.currentUser.user.id;
			callback();
		});
	}
}

module.exports = FetchByIdTest;
