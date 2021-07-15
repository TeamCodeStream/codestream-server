'use strict';

const ReviewTest = require('./review_test');

class AddReviewFollowersTest extends ReviewTest {

	get description () {
		return 'should return a valid post and review with correct follower IDs when creating a post with a review with an array of followers';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 5;
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(() => {
			// add some followers
			this.data.review.followerIds = [
				this.users[2].user.id,
				this.users[4].user.id
			];
			this.expectedFollowerIds = [this.currentUser.user.id, ...this.data.review.followerIds];
			callback();
		});
	}
}

module.exports = AddReviewFollowersTest;
