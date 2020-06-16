'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class ReviewReplyMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		const type = this.isTeamStream ? 'team' : this.type;
		return `should create and publish a post as a reply to the review when an inbound email call is made for a review created in a ${type} stream`;
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				creatorIndex: 0,
				wantReview: true,
				wantMarkers: 1
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
		// team channel for file-type streams, or team-streams, otherwise the stream channel
		if (this.type === 'file' || this.isTeamStream) {
			this.channelName = `team-${this.team.id}`;
		}
		else {
			this.channelName = `stream-${this.stream.id}`;
		}
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
					reviews: [{
						id: this.postData[0].review.id,
						_id: this.postData[0].review.id, // DEPRECATE ME
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
					this.updateMessage.reviews[0].$addToSet = { followerIds: this.users[1].user.id };
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

		// ...and the other is for the update to the parent post and review
		const post = message.message.post;
		const review = message.message.reviews[0];
		Assert(post.$set.modifiedAt >= this.requestSentAt, 'post modifiedAt should be set to after the request was sent');
		this.updateMessage.post.$set.modifiedAt = post.$set.modifiedAt;
		Assert(review.$set.modifiedAt >= this.requestSentAt, 'review modifiedAt should be set to after the request was sent');
		Assert(review.$set.lastReplyAt >= this.requestSentAt, 'review modifiedAt should be set to after the request was sent');
		Assert(review.$set.lastActivityAt >= this.requestSentAt, 'review modifiedAt should be set to after the request was sent');
		Object.assign(this.updateMessage.reviews[0].$set, {
			modifiedAt: review.$set.modifiedAt,
			lastReplyAt: review.$set.lastReplyAt,
			lastActivityAt: review.$set.lastActivityAt
		});
		this.message = this.updateMessage;
		if (super.validateMessage(message)) {
			this.validatedUpdateMessage = true;
			return this.validatedPostMessage; // don't return test pass condition until we've received both messages
		}
	}
}

module.exports = ReviewReplyMessageTest;
