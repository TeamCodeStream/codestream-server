'use strict';

const PutStreamTest = require('./put_stream_test');

class RemoveUserTest extends PutStreamTest {

	get description () {
		return 'should return the updated stream and directive when removing a user from a stream';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.streamOptions.members = 'all';
			callback();
		});
	}

	// form the data for the stream update
	makeStreamData (callback) {
		// find one of the other users in the stream, and remove them from the stream
		super.makeStreamData(() => {
			this.removedUsers = this.getRemovedUsers();
			this.expectedData.stream.$pull = this.expectedData.stream.$pull || {};
			if (this.removedUsers.length === 1) {
				// this tests conversion of single element to an array
				const removedUser = this.removedUsers[0];
				this.data.$pull = { memberIds: removedUser._id };
				this.expectedData.stream.$pull.memberIds = [removedUser._id];
			}
			else {
				const removedUserIds = this.removedUsers.map(user => user._id);
				this.data.$pull = { memberIds: removedUserIds };
				this.expectedData.stream.$pull.memberIds = [...removedUserIds];
			}
			callback();
		});
	}

	// get the users we want to add to the stream
	getRemovedUsers () {
		return [this.users[2].user];
	}
}

module.exports = RemoveUserTest;
