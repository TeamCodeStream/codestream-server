'use strict';

const ReviewTest = require('./review_test');

class NoFollowReviewCreationByPreferenceTest extends ReviewTest {

	get description () {
		return 'when a review is created and the creator has notification preferences turned off, the user should not be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.expectedFollowerIds = [];
			this.setNotificationPreference('off', 0, callback);
		});
	}
}

module.exports = NoFollowReviewCreationByPreferenceTest;
