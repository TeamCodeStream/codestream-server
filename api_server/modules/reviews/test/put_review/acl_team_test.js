'use strict';

const PutReviewTest = require('./put_review_test');

class ACLTeamTest extends PutReviewTest {

	get description () {
		return 'should return an error when trying to update a review in a team the user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'user must be on the team that owns the review'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			this.teamOptions.members = [];
			callback();
		});
	}
}

module.exports = ACLTeamTest;
