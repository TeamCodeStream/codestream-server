'use strict';

const PutCodeErrorTest = require('./put_code_error_test');

class AddAssigneeTest extends PutCodeErrorTest {

	get description () {
		return 'should return the updated code error and directive when adding an assignee to a code error';
	}
   
	// form the data for the stream update
	makeCodeErrorUpdateData (callback) {
		// find one of the other users in the team, and add them to the stream
		super.makeCodeErrorUpdateData(() => {
			this.addedUsers = this.getAddedUsers();
			this.expectedData.codeError.$addToSet = this.expectedData.codeError.$addToSet || {};
			if (this.addedUsers.length === 1) {
				// this tests conversion of single element to an array
				const addedUser = this.addedUsers[0];
				this.data.$addToSet = { assignees: addedUser.id };
				this.expectedData.codeError.$addToSet.assignees = [addedUser.id];
				this.expectedData.codeError.$addToSet.followerIds = [addedUser.id];
			}
			else {
				const addedUserIds = this.addedUsers.map(user => user.id);
				this.data.$addToSet = { assignees: addedUserIds };
				this.expectedData.codeError.$addToSet.assignees = [...addedUserIds];
				this.expectedData.codeError.$addToSet.followerIds = [...addedUserIds];
			}
			this.expectedData.codeError.$addToSet.assignees.sort();
			this.expectedData.codeError.$addToSet.followerIds.sort();
			callback();
		});
	}

	// get the users we want to add to the code error
	getAddedUsers () {
		return [this.users[2].user];
	}

	// validate the response to the test request
	validateResponse (data) {
		data.codeError.$addToSet.assignees.sort();
		data.codeError.$addToSet.followerIds.sort();
		super.validateResponse(data);
	}
}

module.exports = AddAssigneeTest;
