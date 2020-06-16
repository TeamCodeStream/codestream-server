'use strict';

const RemoveUserTest = require('./remove_user_test');

class RemoveUsersTest extends RemoveUserTest {

	get description () {
		return 'should return the updated stream and correct directive when removing multiple users from a stream';
	}
   
	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.numAdditionalInvites = 2;
			this.userOptions.numRegistered = 4;
			callback();
		});
	}

	// get the users we want to remove from the stream
	getRemovedUsers () {
		return this.users.slice(3).map(user => user.user);
	}
}

module.exports = RemoveUsersTest;
