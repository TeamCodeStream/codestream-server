'use strict';

const AddAssigneeTest = require('./add_assignee_test');

class AddAssigneesTest extends AddAssigneeTest {

	get description () {
		return 'should return the updated code error and correct directive when adding multiple assignees to a code error';
	}
   
	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.numAdditionalInvites = 2;
			this.userOptions.numRegistered = 4;
			callback();
		});
	}

	// get the users we want to add to the code error
	getAddedUsers () {
		return this.users.slice(2).map(user => user.user);
	}
}

module.exports = AddAssigneesTest;
