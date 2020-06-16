'use strict';

const ReviewTest = require('./review_test');

class NoFollowAllReviewsByPreference extends ReviewTest {

	get description () {
		return 'when a review is created and a user has notification preferences off, user should be not be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.expectedFollowerIds = [this.currentUser.user.id];
			this.setNotificationPreference('off', 1, callback);
		});
	}
}

module.exports = NoFollowAllReviewsByPreference;
