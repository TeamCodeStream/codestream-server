'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const PostReplyTest = require('./post_reply_test');
const CommonInit = require('./common_init');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class HasRepliesMessageToStreamTest extends Aggregation(CodeStreamMessageTest, CommonInit, PostReplyTest) {

	get description () {
		return `members of a ${this.type} stream should receive a message with the parent post and hasReplies set to true when the first reply is created to the post`;
	}

	// make the data that triggers the message to be messageReceived
	makeData (callback) {
		BoundAsync.series(this, [
			this.init,
			this.createFirstReply	// create a first reply to the parent post, as needed
		], callback);
	}

	// create a first reply to the parent post, as needed
	createFirstReply (callback) {
		if (!this.wantFirstReply) {
			return callback();
		}
		this.postFactory.createRandomPost(
			callback,
			{
				token: this.users[1].accessToken,
				streamId: this.stream._id,
				parentPostId: this.postData[0].post._id
			}
		);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// it is the stream channel
		this.channelName = `stream-${this.stream._id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// we'll create a post as a reply to the parent post we already created ...
		// since the parent post had a marker, this should cause a message to
		// be sent on the the team channel indicating the numComments field for
		// the marker to the marker has been incremented
		const postOptions = {
			token: this.users[1].accessToken,
			streamId: this.stream._id,
			parentPostId: this.postData[0].post._id
		};
		const numRepliesExpected = this.wantFirstReply ? 2 : 1;
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				// the message should look like this, indicating the hasReplies
				// attribute for the parent post has been set
				this.post = response.post;
				this.message = {
					post: {
						_id: this.postData[0].post._id,
						$set: { 
							hasReplies: true,
							numReplies: numRepliesExpected,
							version: 1 + numRepliesExpected
						},
						$version: {
							before: numRepliesExpected,
							after: numRepliesExpected + 1
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
		// make sure we ignore the original post ... we want to see the parent post
		if (message.message.post && message.message.post._id === this.post._id) {
			return false;
		}
		return super.validateMessage(message);
	}
}

module.exports = HasRepliesMessageToStreamTest;
