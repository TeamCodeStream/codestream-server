'use strict';

const ReviewTest = require('./review_test');

class FollowReviewByPreferenceAllTest extends ReviewTest {

	get description () {
		return 'when a review is created and a user has a preference to follow all codemarks/reviews created on the team, user should be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.expectedFollowerIds = [this.users[1].user.id, this.currentUser.user.id];
			this.setNotificationPreference('all', 1, callback);
		});
	}
}

module.exports = FollowReviewByPreferenceAllTest;
