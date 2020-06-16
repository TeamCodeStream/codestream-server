'use strict';

const RemoveUserTest = require('./remove_user_test');

class RemoveSelfTest extends RemoveUserTest {

	constructor (options) {
		super(options);
		this.dontMakeCurrentUserAdmin = true;
	}

	get description () {
		return 'should not need to be an admin to remove yourself from a team';
	}
   
	// get the users we want to remove from the team
	getRemovedUsers () {
		return [this.currentUser.user];
	}
}

module.exports = RemoveSelfTest;
