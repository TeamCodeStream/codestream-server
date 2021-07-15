'use strict';

const ReviewTest = require('./review_test');

class FollowReviewByPreferenceDirectStreamTest extends ReviewTest {

	constructor (options) {
		super(options);
		this.streamOptions.type = 'direct';
		this.streamOptions.members = [0];
	}

	get description () {
		return 'when a review is created in a DM with a user who has a preference to follow reviews involving them, the other user should be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.expectedFollowerIds = [this.currentUser.user.id, this.users[1].user.id];
			this.setNotificationPreference('involveMe', 1, callback);
		});
	}
}

module.exports = FollowReviewByPreferenceDirectStreamTest;
