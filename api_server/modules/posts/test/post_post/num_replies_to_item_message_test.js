'use strict';

const NumRepliesMessageToStreamTest = require('./num_replies_message_to_stream_test');

class NumRepliesToItemMessageTest extends NumRepliesMessageToStreamTest {

	get description () {
		return `members of a ${this.type} stream should receive the updated item with numReplies incremented along with the updated parent post when a reply is created to a post with an item`;
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.wantItem = true;
			callback();
		});
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// add updated item op to the message we expect
		super.generateMessage(error => {
			if (error) { return callback(error); }
			this.message.item = {
				_id: this.postData[0].item._id,
				$set: { 
					numReplies: 2,
					version: 3
				},
				$version: {
					before: 2,
					after: 3
				}
			};
			callback();
		});
	}
}

module.exports = NumRepliesToItemMessageTest;
