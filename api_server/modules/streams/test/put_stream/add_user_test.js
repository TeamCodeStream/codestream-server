'use strict';

const PutStreamTest = require('./put_stream_test');

class AddUserTest extends PutStreamTest {

	get description () {
		return 'should return the updated stream and directive when adding a user to a stream';
	}
   
	// form the data for the stream update
	makeStreamData (callback) {
		// find one of the other users in the team, and add them to the stream
		super.makeStreamData(() => {
			this.addedUsers = this.getAddedUsers();
			this.expectedData.stream.$addToSet = this.expectedData.stream.$addToSet || {};
			if (this.addedUsers.length === 1) {
				// this tests conversion of single element to an array
				const addedUser = this.addedUsers[0];
				this.data.$addToSet = { memberIds: addedUser.id };
				this.expectedData.stream.$addToSet.memberIds = [addedUser.id];
			}
			else {
				const addedUserIds = this.addedUsers.map(user => user.id);
				this.data.$addToSet = { memberIds: addedUserIds };
				this.expectedData.stream.$addToSet.memberIds = [...addedUserIds];
			}
			this.expectedData.stream.$addToSet.memberIds.sort();
			callback();
		});
	}

	// get the users we want to add to the stream
	getAddedUsers () {
		return [this.users[2].user];
	}

	// validate the response to the test request
	validateResponse (data) {
		data.stream.$addToSet.memberIds.sort();
		super.validateResponse(data);
	}
}

module.exports = AddUserTest;
