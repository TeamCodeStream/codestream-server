'use strict';

const EnsureUserTest = require('./ensure_user_test');

class ConfirmUnregisteredUserTest extends EnsureUserTest {

	constructor (options) {
		super(options);
		this.userOptions.numUnregistered = 1;
		this.shouldBeCurrentUser = true;
	}

	get description () {
		return 'should confirm and fetch the existing user, matched by email, when ensuring a user across environments and the user is initially unregistered and teamless';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.currentUser = this.users[1];
			this.data = { user: this.currentUser.user };
			callback();
		});
	}

}

module.exports = ConfirmUnregisteredUserTest;
