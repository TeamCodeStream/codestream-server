'use strict';

const RemoveUserTest = require('./remove_user_test');

class RemoveUsersTest extends RemoveUserTest {

	get description () {
		return 'should return the updated team and correct directive when removing multiple users from a team';
	}
   
	// get the users we want to remove from the team
	getRemovedUsers () {
		return this.otherUserData.slice(1).map(data => data.user);
	}
}

module.exports = RemoveUsersTest;
