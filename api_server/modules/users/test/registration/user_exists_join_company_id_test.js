'use strict';

const UserExistsTest = require('./user_exists_test');

class UserExistsJoinCompanyIdTest extends UserExistsTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		this.teamOptions.creatorIndex = 0;
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return the user when registering an email that already exists as an unconfirmed user, even if joinCompanyId is specified in the registration';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.joinCompanyId = this.company.id;
			callback();
		});
	}
}

module.exports = UserExistsJoinCompanyIdTest;
