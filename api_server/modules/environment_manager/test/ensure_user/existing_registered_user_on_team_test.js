'use strict';

const EnsureUserTest = require('./ensure_user_test');

class ExistingRegisteredUserOnTeamTest extends EnsureUserTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
		this.teamOptions.creatorIndex = 1;
	}

	get description () {
		return 'should create a new user when ensuring a user across environments and the user exists and is registered, but on a team';
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

module.exports = ExistingRegisteredUserOnTeamTest;
