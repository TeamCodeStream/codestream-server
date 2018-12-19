'use strict';

const NewPostMessageToChannelTest = require('./new_post_message_to_channel_test');
const Assert = require('assert');

class MessageToAuthorTest extends NewPostMessageToChannelTest {

	get description () {
		return 'the author of a post should receive a message indicating totalPosts incremented and lastPostCreatedAt set and lastReads for the stream unset when creating a post';
	}

	// make the data the will be used when issuing the request that triggers the message
	makeData (callback) {
		// perform a little trickery here ... set the current user to the creator of the post,
		// since the update message will come back on the creator's me-channel
		super.makeData(() => {
			this.currentUser = this.users[1];
			this.pubnubToken = this.users[1].pubnubToken;
			this.useToken = this.users[1].accessToken;
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// the message comes on the author's me-channel
		this.channelName = `user-${this.users[1].user.id}`;
		// also set the message we expect to receive
		this.timeBeforePost = Date.now();
		callback();
	}

	validateMessage (message) {
		this.message = {
			user: {
				_id: this.users[1].user.id,	// DEPRECATE ME
				id: this.users[1].user.id,
				$set: {
					version: 4,
					totalPosts: 1,
					lastPostCreatedAt: this.timeBeforePost
				},	// this is a placeholder, it should be some time greater than this
				$unset: {
					[`lastReads.${this.stream.id}`]: true
				},
				$version: {
					before: 3,
					after: 4
				}
			}
		};
		const lastPostCreatedAt = message.message.user.$set.lastPostCreatedAt;
		Assert(typeof lastPostCreatedAt === 'number' && lastPostCreatedAt > this.timeBeforePost, 'lastPostCreatedAt is not set or not greater than the time before the post');
		this.message.user.$set.lastPostCreatedAt = lastPostCreatedAt;	// to pass the base-class validation
		return super.validateMessage(message);
	}
}

module.exports = MessageToAuthorTest;
