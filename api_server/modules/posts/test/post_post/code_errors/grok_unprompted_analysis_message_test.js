'use strict';

const NewPostMessageToTeamStreamTest = require('../new_post_message_to_team_stream_test');
const Assert = require('assert');

class GrokUnpromptedAnalysisMessageTest extends NewPostMessageToTeamStreamTest {

	constructor (options) {
		super(options);
		this.messages = [];
	}

	get description () {
		return 'members of the stream should receive a message when Grok adds its analysis as a post to a channel stream';
	}

	makePostData (callback) {
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.data.codeError = this.codeErrorFactory.getRandomCodeErrorData();
			this.data.analyze = true;

			// allow to create code error without checking New Relic account access
			this.apiRequestOptions = this.apiRequestOptions || {};
			this.apiRequestOptions.headers = this.apiRequestOptions.headers || {};
			this.apiRequestOptions.headers['X-CS-NewRelic-Secret'] = this.apiConfig.sharedSecrets.commentEngine;

			callback();
		});
	}

	messageReceived(error, message){
		this.messages.push(message);
		
		if(this.messages.length === 3){
			if (this.messageCallback) {
				this.testLog(`Message ${message.messageId} validated`);
				this.messageCallback();
			}
			else {
				this.testLog(`Message ${message.messageId} already received`);
				this.messageAlreadyReceived = true;
			}

			this.validateMessages()
		}
	}

	// validate the message received against expectations
	// EXPECTING THREE MESSAGES
	validateMessages () {
		Assert.equal(this.messages.length, 3);

		const grokUser = this.messages.find(m => m.message && m.message.user && m.message.user.username === "Grok");
		const parentPost = this.messages.find(m => m.message && m.message.post && m.message.post.parentPostId === undefined);
		const grokReply = this.messages.find(m => m.message && m.message.post && m.message.post.promptRole !== undefined && m.message.post.promptRole === "assistant");

		Assert.notEqual(grokUser, undefined, "Grok user was not present in messages");
		Assert.notEqual(parentPost, undefined, "Parent post was not present in messages");
		Assert.notEqual(grokReply, undefined, "Grok reply was not present in messages");

		Assert.equal(grokReply.creatorId, grokUser.id, "Grok reply was not created by Grok user");
		Assert.equal(parentPost.id, grokReply.parentPostId, "Grok reply was not properly tied to the parent post");
		Assert.notEqual(parentPost.codeErrorId, "", "Parent post is not associated with a Code Error");

	}
}

module.exports = GrokUnpromptedAnalysisMessageTest;
