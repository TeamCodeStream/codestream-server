'use strict';

const UserExistsTest = require('./user_exists_test');

class UserExistsCompanyNameTest extends UserExistsTest {

	get description () {
		return 'should return the user when registering an email that already exists as an unconfirmed user, even if companyName is specified in the registration';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.companyName = this.companyFactory.randomName();
			callback();
		});
	}
}

module.exports = UserExistsCompanyNameTest;
