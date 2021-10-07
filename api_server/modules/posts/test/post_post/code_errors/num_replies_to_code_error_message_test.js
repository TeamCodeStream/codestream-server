'use strict';

const NumRepliesMessageToStreamTest = require('../num_replies_message_to_stream_test');
const Assert = require('assert');

class NumRepliesToCodeErrorMessageTest extends NumRepliesMessageToStreamTest {

	get description () {
		return `followers of a code error should receive the updated code error with numReplies incremented along with the updated parent post when a reply is created to a code error`;
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.wantCodeError = true;
			callback();
		});
	}

	// create a first reply to the parent post
	createFirstReply (callback) {
		this.postFactory.createRandomPost(
			callback,
			{
				token: this.users[1].accessToken,
				streamId: this.postData[0].post.streamId,
				parentPostId: this.postData[0].post.id,
				mentionedUserIds: [this.currentUser.user.id] // this allows user to listen on object stream
			}
		);
	}
		
	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// messages associated with code errors are received on an object stream
		this.channelName = `object-${this.postData[0].post.codeErrorId}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// add updated codemark op to the message we expect
		super.generateMessage(error => {
			if (error) { return callback(error); }
			this.message.codeErrors = [{
				_id: this.postData[0].codeError.id,	// DEPRECATE ME
				id: this.postData[0].codeError.id,
				$set: { 
					numReplies: 2,
					version: 3
				},
				$version: {
					before: 2,
					after: 3
				}
			}];
			callback();
		});
	}

	validateMessage (message) {
		// only look for directives in the message
		if (!message.message.post || !message.message.post.$set) {
			return false;
		}
		const codeError = message.message.codeErrors[0];
		Assert(codeError.$set.modifiedAt >= this.postCreatedAt, 'modifiedAt for code error not changed');
		Assert(codeError.$set.lastReplyAt === codeError.$set.modifiedAt, 'lastReplyAt should be equal to modifiedAt');
		Assert(codeError.$set.lastActivityAt === codeError.$set.modifiedAt, 'lastReplyAt should be equal to modifiedAt');
		Object.assign(this.message.codeErrors[0].$set, {
			modifiedAt: codeError.$set.modifiedAt,
			lastReplyAt: codeError.$set.lastReplyAt,
			lastActivityAt: codeError.$set.lastActivityAt
		});
		return super.validateMessage(message);
	}
}

module.exports = NumRepliesToCodeErrorMessageTest;
