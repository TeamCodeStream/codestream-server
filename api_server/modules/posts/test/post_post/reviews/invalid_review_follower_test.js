'use strict';

const AddReviewFollowersTest = require('./add_review_followers_test');
const ObjectId = require('mongodb').ObjectId;

class InvalidReviewFollowerTest extends AddReviewFollowersTest {

	get description () {
		return 'should return an error if an unknown user is added as the follower of a review created with a post';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'followers must contain only users on the team'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.review.followerIds.push(ObjectId());
			callback();
		});
	}
}

module.exports = InvalidReviewFollowerTest;
