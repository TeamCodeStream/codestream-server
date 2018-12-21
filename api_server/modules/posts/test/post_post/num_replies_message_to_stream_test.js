'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const PostReplyTest = require('./post_reply_test');
const CommonInit = require('./common_init');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class NumRepliesMessageToStreamTest extends Aggregation(CodeStreamMessageTest, CommonInit, PostReplyTest) {

	get description () {
		return `members of a ${this.type} stream should receive a message with the parent post and numReplies incremented when a reply is created to the post`;
	}

	// make the data that triggers the message to be messageReceived
	makeData (callback) {
		BoundAsync.series(this, [
			this.init,
			this.createFirstReply	// create a first reply to the parent post
		], callback);
	}

	// create a first reply to the parent post
	createFirstReply (callback) {
		this.postFactory.createRandomPost(
			callback,
			{
				token: this.users[1].accessToken,
				streamId: this.stream.id,
				parentPostId: this.postData[0].post.id
			}
		);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// it is the stream channel
		this.channelName = `stream-${this.stream.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// we'll create a post as a reply to the parent post we already created ...
		// since we already did one reply, we should now see a message that 
		// numReplies for the parent post is set to 2
		const postOptions = {
			token: this.users[1].accessToken,
			streamId: this.stream.id,
			parentPostId: this.postData[0].post.id
		};
		this.postCreatedAt = Date.now();
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				this.message = {
					post: {
						_id: this.postData[0].post.id,	// DEPRECATE ME
						id: this.postData[0].post.id,
						$set: { 
							numReplies: 2,
							version: 3
						},
						$version: {
							before: 2,
							after: 3
						}
					}
				};
				callback();
			},
			postOptions
		);
	}

	// validate the message received against expectations
	validateMessage (message) {
		// only look for directives in the message
		if (!message.message.post || !message.message.post.$set) {
			return false;
		}
		Assert(message.message.post.$set.modifiedAt > this.postCreatedAt, 'modifiedAt not changed');
		this.message.post.$set.modifiedAt = message.message.post.$set.modifiedAt;
		return super.validateMessage(message);
	}
}

module.exports = NumRepliesMessageToStreamTest;
