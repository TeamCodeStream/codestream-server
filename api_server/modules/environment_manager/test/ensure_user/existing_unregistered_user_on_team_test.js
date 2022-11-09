'use strict';

const EnsureUserTest = require('./ensure_user_test');

class ExistingUnregisteredUserOnTeamTest extends EnsureUserTest {

	constructor (options) {
		super(options);
		this.userOptions.numUnregistered = 1;
		this.teamOptions.creatorIndex = 0;
	}

	get description () {
		return 'should create a new user when ensuring a user across environments and the user exists and is unregistered, but on a team';
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

module.exports = ExistingUnregisteredUserOnTeamTest;
