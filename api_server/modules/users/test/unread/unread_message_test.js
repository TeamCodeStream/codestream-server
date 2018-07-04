'use strict';

const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const CommonInit = require('./common_init');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');

class UneadMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'the user should receive a message on their me-channel when they indicate they mark a post as unread';
	}

	// make the data we need to perform the test...
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// should come back through the user's me-channel
		this.channelName = 'user-' + this.currentUser._id;
		callback();
	}

	// issue the api request that triggers the message
	generateMessage (callback) {
		// we expect to see the sequence number set to the sequence number of the previous post
		// to the post that was marked unread ... the sequence numbers are 1-based so this is 
		// just the same as the ordinal number of the post in the array of posts created
		this.message = {
			user: {
				_id: this.currentUser._id,
				$set: {
					[`lastReads.${this.stream._id}`]: this.unreadPost
				}
			}
		};
		this.markUnread(callback);
	}
}

module.exports = UneadMessageTest;
