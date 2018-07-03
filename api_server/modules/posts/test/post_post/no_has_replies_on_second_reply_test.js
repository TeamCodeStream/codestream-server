'use strict';

const HasRepliesMessageToStreamTest = require('./has_replies_message_to_stream_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class NoHasRepliesOnSecondReplyTest extends HasRepliesMessageToStreamTest {

	get description () {
		return `members of a ${this.type} stream should NOT receive a message with the parent post and hasReplies set to true when the second reply is created to the post`;
	}

	// make the data that triggers the message to be messageReceived
	makeData (callback) {
		BoundAsync.series(this, [
			super.makeData,
			this.createFirstReply // create the first reply to the parent post, which obviates hasReplies being set in the test post
		], callback);
	}

	// create the first reply to the parent post, which obviates hasReplies being set in the test post
	createFirstReply (callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.firstReply = response.post;
				callback();
			},
			{
				token: this.postCreatorData.accessToken,	// the "post creator" also creates the first reply
				streamId: this.stream._id,
				parentPostId: this.parentPost._id
			}
		);
	}

	// called if message doesn't arrive after timeout, in this case, this is what we want
	messageTimeout () {
		this.messageCallback();
	}

	// called when a message has been received
	messageReceived (error, message) {
		if (error) { return this.messageCallback(error); }
		if (
			message.message &&
			message.message.post &&
			message.message.post._id === this.parentPost._id 
		) {
			Assert.fail('message with parent post was received');
		}
		return false;
	}
}

module.exports = NoHasRepliesOnSecondReplyTest;
