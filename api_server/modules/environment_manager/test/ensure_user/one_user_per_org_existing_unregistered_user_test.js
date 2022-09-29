'use strict';

const OneUserPerOrgExistingUserTest = require('./one_user_per_org_existing_user_test');

class OneUserPerOrgExistingUnregisteredUserTest extends OneUserPerOrgExistingUserTest {

	constructor (options) {
		super(options);
		this.userOptions.numUnregistered = 1;
	}

	get description () {
		return 'should create a new user record under one-user-per-org, when ensuring a user across environments and the user is initially unregistered';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// make the "current" user the unregistered one
			this.currentUser = this.users[1];
			this.data = { user: this.currentUser.user };
			callback();
		});
	}

}

module.exports = OneUserPerOrgExistingUnregisteredUserTest;
