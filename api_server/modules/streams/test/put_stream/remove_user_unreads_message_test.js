'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const RemoveUserTest = require('./remove_user_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class RemoveUserUnreadsMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit, RemoveUserTest) {

	get description () {
		return 'when a user is removed from a stream, that user should receive a message on their user change to clear the lastReads for that stream';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			callback();
		});
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// get array of users to remove from the stream
	getRemovedUsers () {
		return [this.currentUser.user];
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// lastReads is being updated for the individual user
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the update, this should trigger a message to the
		// stream channel with the updated stream
		this.updatedAt = Date.now();
		this.updateStream(error => {
			if (error) { return callback(error); }
			this.message = {
				user: {
					_id: this.currentUser.user.id,	// DEPRECATE ME
					id: this.currentUser.user.id,
					$unset: {
						[`lastReads.${this.stream.id}`]: true
					},
					$set: {
						version: 4
					},
					$version: {
						before: 3,
						after: 4
					}
				}
			};
			callback();
		});
	}

	validateMessage (message) {
		Assert(message.message.user.$set.modifiedAt > this.updatedAt, 'modifedAt not changed');
		this.message.user.$set.modifiedAt = message.message.user.$set.modifiedAt;
		return super.validateMessage(message);
	}
}

module.exports = RemoveUserUnreadsMessageTest;
