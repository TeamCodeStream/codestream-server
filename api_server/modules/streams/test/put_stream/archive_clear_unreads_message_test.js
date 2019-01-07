'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class ArchiveClearUnreadsMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'when a channel stream is archived, all users in the stream should receive a message to clear lastReads for the stream';
	}

	makeData (callback) {
		this.init(callback);
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			callback();
		});
	}

	// get the data for the stream update
	getUpdateData () {
		return {
			isArchived: true
		};
	}
	
	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// lastReads is being updated for the individual user
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
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
		Assert(message.message.user.$set.modifiedAt >= this.updatedAt, 'modifiedAt not changed');
		this.message.user.$set.modifiedAt = message.message.user.$set.modifiedAt;
		return super.validateMessage(message);
	}
}

module.exports = ArchiveClearUnreadsMessageTest;
