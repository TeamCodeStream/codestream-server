'use strict';

const AddReviewFollowersTest = require('./add_review_followers_test');

class AddReviewCreatorAsFollowerTest extends AddReviewFollowersTest {

	get description () {
		return 'when adding a creator as the follower of a review created with a post, creator ID should not get added twice';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.review.followerIds.push(this.currentUser.user.id);
			callback();
		});
	}
}

module.exports = AddReviewCreatorAsFollowerTest;
