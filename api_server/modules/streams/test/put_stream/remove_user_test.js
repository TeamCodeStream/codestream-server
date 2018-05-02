'use strict';

const PutStreamTest = require('./put_stream_test');
const Assert = require('assert');
const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');

class RemoveUserTest extends PutStreamTest {

	constructor (options) {
		super(options);
		this.everyoneInStream = true;
	}

	get description () {
		return 'should return the updated stream and directive when removing a user from a stream';
	}
   
	getExpectedFields () {
		let fields = super.getExpectedFields();
		return {
			stream: {
				$set: fields.stream,
				$pull: ['memberIds']
			}
		};
	}

	// form the data for the stream update
	makeStreamData (callback) {
		// find one of the other users in the stream, and remove them from the stream
		super.makeStreamData(() => {
			this.removedUsers = this.getRemovedUsers();
			if (this.removedUsers.length === 1) {
				// this tests conversion of single element to an array
				const removedUser = this.removedUsers[0];
				this.data.$pull = { memberIds: removedUser._id };
				if (this.expectedStream && this.expectedStream.memberIds) {
					this.expectedStream.memberIds = ArrayUtilities.difference(this.expectedStream.memberIds, [removedUser._id]);
				}
			}
			else {
				const removedUserIds = this.removedUsers.map(user => user._id);
				this.data.$pull = { memberIds: removedUserIds };
				if (this.expectedStream && this.expectedStream.memberIds) {
					this.expectedStream.memberIds = ArrayUtilities.difference(this.expectedStream.memberIds, removedUserIds);
				}
			}
			callback();
		});
	}

	// get the users we want to add to the stream
	getRemovedUsers () {
		const removedUser = this.users.find(user => {
			return user._id !== this.currentUser._id && user._id !== this.otherUserData.user._id;
		});
		return [removedUser];
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got a directive in the update to remove the user
		let stream = data.stream;
		const membersRemoved = this.removedUsers.map(user => user._id);
		membersRemoved.sort();
		stream.$pull.memberIds.sort();
		Assert.deepEqual(membersRemoved, stream.$pull.memberIds, 'removed membership array not equal to the users who were removed');
		super.validateResponse(data, true);
	}
}

module.exports = RemoveUserTest;
