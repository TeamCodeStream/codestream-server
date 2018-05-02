'use strict';

const PutStreamTest = require('./put_stream_test');
const Assert = require('assert');

class AddUserTest extends PutStreamTest {

	get description () {
		return 'should return the updated stream and directive when adding a user to a stream';
	}
   
	getExpectedFields () {
		let fields = super.getExpectedFields();
		return {
			stream: {
				$set: fields.stream,
				$addToSet: ['memberIds']
			}
		};
	}

	// form the data for the stream update
	makeStreamData (callback) {
		// find one of the other users in the team, and add them to the stream
		super.makeStreamData(() => {
			this.addedUsers = this.getAddedUsers();
			if (this.addedUsers.length === 1) {
				// this tests conversion of single element to an array
				const addedUser = this.addedUsers[0];
				this.data.$addToSet = { memberIds: addedUser._id };
				if (this.expectedStream && this.expectedStream.memberIds) {
					this.expectedStream.memberIds.push(addedUser._id);
				}
			}
			else {
				const addedUserIds = this.addedUsers.map(user => user._id);
				this.data.$addToSet = { memberIds: addedUserIds };
				if (this.expectedStream && this.expectedStream.memberIds) {
					this.expectedStream.memberIds = this.expectedStream.memberIds.concat(addedUserIds);
				}
			}
			callback();
		});
	}

	// get the users we want to add to the stream
	getAddedUsers () {
		return [this.addedUserData.user];
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got a directive in the update to add the user
		let stream = data.stream;
		const membersAdded = this.addedUsers.map(user => user._id);
		membersAdded.sort();
		stream.$addToSet.memberIds.sort();
		Assert.deepEqual(membersAdded, stream.$addToSet.memberIds, 'added membership array not equal to the users who were added');
		super.validateResponse(data, true);
	}
}

module.exports = AddUserTest;
