'use strict';

const AddUserTest = require('./add_user_test');

class AddUsersTest extends AddUserTest {

	get description () {
		return 'should return the updated stream and correct directive when adding multiple users to a stream';
	}
   
	// get the users we want to add to the stream
	getAddedUsers () {
		const addedUsers = this.users.filter(user => {
			return user._id !== this.currentUser._id && user._id !== this.otherUserData.user._id;
		});
		return addedUsers.slice(1);
	}
}

module.exports = AddUsersTest;
