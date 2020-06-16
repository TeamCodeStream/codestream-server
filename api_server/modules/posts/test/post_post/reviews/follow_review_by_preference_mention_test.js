'use strict';

const ReviewTest = require('./review_test');

class FollowReviewByPreferenceMentionTest extends ReviewTest {

	get description () {
		return 'when a review is created and mentions a user who has a preference to follow reviews involving them, the mentioned user should be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.mentionedUserIds = [this.users[1].user.id];
			this.expectedFollowerIds = [this.currentUser.user.id, this.users[1].user.id];
			this.setNotificationPreference('involveMe', 1, callback);
		});
	}
}

module.exports = FollowReviewByPreferenceMentionTest;
