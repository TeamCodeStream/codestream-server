'use strict';

const ReviewTest = require('./review_test');
const Assert = require('assert');

class TotalReviewsTest extends ReviewTest {

	get description () {
		return 'the author of a post should receive a message indicating totalReviews incremented when creating a review';
	}

	// make the data the will be used when issuing the request that triggers the message
	makeData (callback) {
		// perform a little trickery here ... set the current user to the creator of the post,
		// since the update message will come back on the creator's me-channel
		super.makeData(() => {
			this.currentUser = this.users[1];
			this.broadcasterToken = this.users[1].broadcasterToken;
			this.useToken = this.users[1].accessToken;
			this.updatedAt = Date.now();
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
					totalReviews: 1,
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
		Assert(message.message.user.$set.modifiedAt >= this.updatedAt, 'modifiedAt not changed');
		this.message.user.$set.modifiedAt = message.message.user.$set.modifiedAt;
		return super.validateMessage(message);
	}
}

module.exports = TotalReviewsTest;
