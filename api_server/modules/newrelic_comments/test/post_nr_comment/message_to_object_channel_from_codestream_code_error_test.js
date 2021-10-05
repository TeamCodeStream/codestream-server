'use strict';

const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');

class MessageToObjectChannelFromCodeStreamCodeErrorTest extends CodeStreamMessageTest {

	get description () {
		return 'followers of a code error should receive a message on the object channel for that code error after a reply through the comments engine, if the code error was created from CodeStream';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		Object.assign(this.postOptions, {
			creatorIndex: 1,
			wantCodeError: true
		});
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.replyToCodeError
		], callback);
	}

	// reply the code error with a mention of the current user, so they can subscribe
	replyToCodeError (callback) {
		const codeError = this.postData[0].codeError;
		const data = this.nrCommentFactory.getRandomNRCommentData();
		Object.assign(data, {
			objectId: codeError.objectId,
			objectType: codeError.objectType,
			accountId: codeError.accountId,
			parentPostId: this.postData[0].post.id,
			creator: {
				email: this.users[1].user.email
			},
			mentionedUsers: [{
				email: this.users[0].user.email
			}]
		});
		this.doApiRequest(
			{
				method: 'post',
				path: `/nr-comments`,
				data,
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-NewRelic-AccountId': data.accountId,
						'X-CS-Want-CS-Response': this.apiConfig.sharedSecrets.commentEngine
					}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.initialNRCommentResponse = response;
				this.data = this.nrCommentFactory.getRandomNRCommentData();
				Object.assign(this.data, {
					objectId: data.objectId,
					objectType: data.objectType,
					accountId: data.accountId,
					parentPostId: response.post.id,
					creator: {
						email: this.users[1].user.email
					}
				});
				callback();
			}
		);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		this.channelName = `object-${this.postData[0].codeError.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: `/nr-comments`,
				data: this.data,
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-NewRelic-AccountId': this.data.accountId,
						'X-CS-Want-CS-Response': this.apiConfig.sharedSecrets.commentEngine
					}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response.codeStreamResponse;
				callback();
			}
		);
	}

	// validate the message received
	validateMessage (message) {
		if (message.message.post && message.message.post.$set) { return; }
		return super.validateMessage(message);
	}
}

module.exports = MessageToObjectChannelFromCodeStreamCodeErrorTest;
