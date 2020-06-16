'use strict';

const AddReviewFollowersTest = require('./add_review_followers_test');

class ReviewFollowerNotOnTeamTest extends AddReviewFollowersTest {

	get description () {
		return 'should return an error if a user from a different team is added as the follower of a review created with a post';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'followers must contain only users on the team'
		};
	}

	setTestOptions( callback) {
		super.setTestOptions(() => {
			// create an additional user that won't be on the team, then include them as a follower
			this.userOptions.numRegistered = 6;
			this.teamOptions.members = [0, 1, 2, 3, 4];
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(() => {
			// include a user not on the team as a follower
			this.data.review.followerIds.push(this.users[5].user.id);
			callback();
		});
	}
}

module.exports = ReviewFollowerNotOnTeamTest;
