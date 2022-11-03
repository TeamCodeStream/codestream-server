'use strict';

const EnsureUserTest = require('./ensure_user_test');

class ExistingRegisteredUserTest extends EnsureUserTest {

	constructor (options) {
		super(options);
		this.shouldBeCurrentUser = true;
	}
	
	get description () {
		return 'should fetch the existing registered user when ensuring a user across environments and the user exists and is registered, but teamless';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data = { user: this.currentUser.user };
			callback();
		});
	}
}

module.exports = ExistingRegisteredUserTest;
