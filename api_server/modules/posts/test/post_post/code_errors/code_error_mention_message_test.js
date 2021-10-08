'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CommonInit = require('../common_init');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');

class CodeErrorMentionMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'users who are mentioned in a reply to a code error should get a message on their user channel with the code error, the indexing post, and the reply';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set options for the test
	setTestOptions (callback) {
		// create an initial code error to reply to
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				creatorIndex: 1,
				wantCodeError: true
			});
			callback();
		});
	}

	// make the data to be used for the test request
	makePostData (callback) {
		super.makePostData(error => {
			if (error) { return callback(error); }
			Object.assign(this.data, {
				streamId: this.postData[0].codeError.streamId,
				parentPostId: this.postData[0].post.id,
				codeError: undefined,
				mentionedUserIds: [this.currentUser.user.id]
			});
			this.useToken = this.users[1].accessToken;
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.createPost(callback);
	}

	// validate the message received
	validateMessage (message) {
		const incomingCodeError = message.message.codeErrors[0];
		const incomingParentPost = message.message.posts[0];
		this.message = {
			posts: [
				this.postData[0].post,
				this.message.post
			],
			codeErrors: [
				this.postData[0].codeError
			]
		};
		incomingCodeError.followerIds.sort();
		Object.assign(this.message.codeErrors[0], {
			followerIds: [this.users[1].user.id, this.users[0].user.id].sort(),
			lastActivityAt: incomingCodeError.lastActivityAt,
			lastReplyAt: incomingCodeError.lastReplyAt,
			modifiedAt: incomingCodeError.modifiedAt,
			numReplies: 1,
			version: 2
		});
		Object.assign(this.message.posts[0], {
			modifiedAt: incomingParentPost.modifiedAt,
			numReplies: 1,
			version: 2 
		});
		return super.validateMessage(message);
	}
}

module.exports = CodeErrorMentionMessageTest;
