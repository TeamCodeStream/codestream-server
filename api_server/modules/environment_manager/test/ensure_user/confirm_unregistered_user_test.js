'use strict';

const EnsureExistingUserTest = require('./ensure_existing_user_test');

class ConfirmUnregisteredUserTest extends EnsureExistingUserTest {

	constructor (options) {
		super(options);
		this.userOptions.numUnregistered = 1;
	}

	get description () {
		return 'should confirm and fetch the existing user, matched by email, when ensuring a user across environments and the user is initially unregistered';
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

module.exports = ConfirmUnregisteredUserTest;
