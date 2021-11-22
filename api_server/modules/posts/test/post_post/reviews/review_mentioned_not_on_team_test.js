'use strict';

const ReviewFollowersMentionedTest = require('./review_followers_mentioned_test');

class ReviewMentionedNotOnTeamTest extends ReviewFollowersMentionedTest {

	get description () {
		return 'should return an error if a user from a different team is mentioned for a review created with a post';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			reason: 'one or more mentioned users are not on the team'
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
			this.data.mentionedUserIds.push(this.users[5].user.id);
			callback();
		});
	}
}

module.exports = ReviewMentionedNotOnTeamTest;
