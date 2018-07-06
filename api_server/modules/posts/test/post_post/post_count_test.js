'use strict';

var NewPostMessageToTeamTest = require('./new_post_message_to_team_test');
var Assert = require('assert');

class PostCountTest extends NewPostMessageToTeamTest {

	get description () {
		return 'the author of a post should receive a message indicating totalPosts incremented and lastPostCreatedAt set when creating a post';
	}

	// make the data the will be used when issuing the request that triggers the message
	makeData (callback) {
		// perform a little trickery here ... set the current user to the creator of the post,
		// since the update message will come back on the creator's me-channel
		super.makeData(() => {
			this.currentUser = this.postCreatorData.user;
			this.pubNubToken = this.postCreatorData.pubNubToken;
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// the message comes on the author's me-channel
		this.channelName = 'user-' + this.postCreatorData.user._id;
		// also set the message we expect to receive
		this.timeBeforePost = Date.now();
		callback();
	}

	validateMessage (message) {
		this.message = {
			user: {
				_id: this.postCreatorData.user._id,
				$inc: { totalPosts: 1 },
				$set: { lastPostCreatedAt: this.timeBeforePost }	// this is a placeholder, it should be some time greater than this
			}
		};
		const lastPostCreatedAt = message.message.user.$set.lastPostCreatedAt;
		Assert(typeof lastPostCreatedAt === 'number' && lastPostCreatedAt > this.timeBeforePost, 'lastPostCreatedAt is not set or not greater than the time before the post');
		this.message.user.$set.lastPostCreatedAt = lastPostCreatedAt;	// to pass the base-class validation
		return super.validateMessage(message);
	}
}

module.exports = PostCountTest;
