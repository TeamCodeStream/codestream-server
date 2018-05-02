'use strict';

const RemoveUserTest = require('./remove_user_test');

class RemoveUsersTest extends RemoveUserTest {

	get description () {
		return 'should return the updated stream and correct directive when removing multiple users from a stream';
	}
   
	// get the users we want to remove from the stream
	getRemovedUsers () {
		const removedUsers = this.users.filter(user => {
			return user._id !== this.currentUser._id && user._id !== this.otherUserData.user._id;
		});
		return removedUsers.slice(1);
	}
}

module.exports = RemoveUsersTest;
