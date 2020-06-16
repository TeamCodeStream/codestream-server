'use strict';

const AddUserTest = require('./add_user_test');

class AddUsersTest extends AddUserTest {

	get description () {
		return 'should return the updated stream and correct directive when adding multiple users to a stream';
	}
   
	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.numAdditionalInvites = 2;
			this.userOptions.numRegistered = 4;
			callback();
		});
	}

	// get the users we want to add to the stream
	getAddedUsers () {
		return this.users.slice(2).map(user => user.user);
	}
}

module.exports = AddUsersTest;
