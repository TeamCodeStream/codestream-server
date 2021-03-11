'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class CodemarkReplyMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		const type = this.isTeamStream ? 'team' : this.type;
		return `should create and publish a post as a reply to the codemark when an inbound email call is made for a codemark created in a ${type} stream`;
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				creatorIndex: 0,
				wantCodemark: true,
				wantMarkers: true
			});
			callback();
		});
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			this.data.to[0].address = `${this.postData[0].post.id}.${this.data.to[0].address}`;
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// since posting to any stream other than the team stream is no longer allowed,
		// just listen on the team channel
		this.channelName = `team-${this.team.id}`;

		/*
		// team channel for file-type streams, or team-streams, otherwise the stream channel
		if (this.type === 'file' || this.isTeamStream) {
			this.channelName = `team-${this.team.id}`;
		}
		else {
			throw 'stream channels are deprecated';
			//this.channelName = `stream-${this.stream.id}`;
		}
		*/
		
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// simulate an inbound email by calling the API server's inbound-email
		// call with post data, this should trigger post creation and a publish
		// of the post through the team channel
		this.requestSentAt = Date.now();
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/inbound-email',
				data: this.data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.postMessage = response;	// we expect the same info through pubnub
				this.updateMessage = {
					post: {
						id: this.postData[0].post.id,
						_id: this.postData[0].post.id, // DEPRECATE ME
						$set: {
							numReplies: 1,
							modifiedAt: Date.now(), // placeholder
							version: 2
						},
						$version: {
							before: 1,
							after: 2
						}
					},
					codemarks: [{
						id: this.postData[0].codemark.id,
						_id: this.postData[0].codemark.id, // DEPRECATE ME
						$set: {
							numReplies: 1,
							lastReplyAt: Date.now(), // placeholder
							lastActivityAt: Date.now(), // placeholder
							modifiedAt: Date.now(), // placeholder
							version: 2
						},
						$version: {
							before: 1,
							after: 2
						}
					}]
				};
				if (this.type !== 'direct') {
					this.updateMessage.codemarks[0].$addToSet = { followerIds: this.users[1].user.id };
				}
				callback();
			}
		);
	}

	validateMessage (message) {
		// we expect two messages ... one for the actual post...
		if (message.message.post && message.message.post.id !== this.postData[0].post.id) {
			this.message = this.postMessage;
			if (super.validateMessage(message)) {
				this.validatedPostMessage = true;
				return this.validatedUpdateMessage; // don't return test pass condition until we've received both messages
			}
		}

		// ...and the other is for the update to the parent post and codemark
		const post = message.message.post;
		const codemark = message.message.codemarks[0];
		Assert(post.$set.modifiedAt >= this.requestSentAt, 'post modifiedAt should be set to after the request was sent');
		this.updateMessage.post.$set.modifiedAt = post.$set.modifiedAt;
		Assert(codemark.$set.modifiedAt >= this.requestSentAt, 'codemark modifiedAt should be set to after the request was sent');
		Assert(codemark.$set.lastReplyAt >= this.requestSentAt, 'codemark modifiedAt should be set to after the request was sent');
		Assert(codemark.$set.lastActivityAt >= this.requestSentAt, 'codemark modifiedAt should be set to after the request was sent');
		Object.assign(this.updateMessage.codemarks[0].$set, {
			modifiedAt: codemark.$set.modifiedAt,
			lastReplyAt: codemark.$set.lastReplyAt,
			lastActivityAt: codemark.$set.lastActivityAt
		});
		this.message = this.updateMessage;
		if (super.validateMessage(message)) {
			this.validatedUpdateMessage = true;
			return this.validatedPostMessage; // don't return test pass condition until we've received both messages
		}
	}
}

module.exports = CodemarkReplyMessageTest;
