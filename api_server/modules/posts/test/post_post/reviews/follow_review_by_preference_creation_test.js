'use strict';

const ReviewTest = require('./review_test');

class FollowReviewByPreferenceCreationTest extends ReviewTest {

	get description () {
		return 'when a review is created and the creator has a preference to follow reviews involving them, the user should be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.setNotificationPreference('involveMe', 0, callback);
		});
	}
}

module.exports = FollowReviewByPreferenceCreationTest;
