'use strict';

const RemoveUserTest = require('./remove_user_test');

class RemoveSelfTest extends RemoveUserTest {

	constructor (options) {
		super(options);
		this.dontMakeCurrentUserAdmin = true;
	}

	get description () {
		return 'per unified identity, must be an admin to remove yourself from a team';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1002'
		};
	}

	// get the users we want to remove from the team
	getRemovedUsers () {
		return [this.currentUser.user];
	}
}

module.exports = RemoveSelfTest;
