'use strict';

const NewPostMessageToTeamStreamTest = require('../new_post_message_to_team_stream_test');
const Assert = require('assert');

class GrokUnpromptedAnalysisMessageTest extends NewPostMessageToTeamStreamTest {

	constructor (options) {
		super(options);
		this.messageReceiveTimeout = 15000;
		this.messages = [];
	}

	run (callback) {
		if(!this.mockMode){
			Assert.equal(true, true, "Test requires Mock Mode!");
			callback();
		}
		else {
			super.run(callback);
		}
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
		if(error) {
			super.messageReceived(error, message);
		}

		this.messages.push(message);
		
		if(this.messages.length === 3){
			this.messageCallback();
		 	this.validateMessages()
		}
	}

	// validate the message received against expectations
	// EXPECTING THREE MESSAGES
	validateMessages () {
		Assert.equal(this.messages.length, 3);

		const posts = [];
		const users = [];

		this.messages.map((m) => {
			if(m.message && m.message.post){
				posts.push(m.message.post);
			}
		});

		this.messages.map((m) => {
			if (m.message && m.message.user){
				users.push(m.message.user);
			}
		});
		
		const parentPost = posts.find(m => !m.parentPostId);
		const grokPost = posts.find(m => m.parentPostId && m.parentPostId === parentPost.id);
		const grokUser = users.find(m => m.username === "Grok");
		
		Assert.notEqual(grokUser, undefined, "Grok user was not present in messages");
		Assert.notEqual(parentPost, undefined, "Parent post was not present in messages");
		Assert.notEqual(grokPost, undefined, "Grok reply was not present in messages");

		Assert.equal(grokPost.creatorId, grokUser.id, "Grok reply was not created by Grok user");
		Assert.equal(parentPost.id, grokPost.parentPostId, "Grok reply was not properly tied to the parent post");
		Assert.notEqual(parentPost.codeErrorId, "", "Parent post is not associated with a Code Error");

		Assert(parentPost.grokConversation === undefined, "Parent post should not have a grokConversation");
		Assert(grokPost.grokConversation === undefined, "Grok reply should not have a grokConversation");
	}
}

module.exports = GrokUnpromptedAnalysisMessageTest;
