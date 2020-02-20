'use strict';

const DeleteReviewTest = require('./delete_review_test');

class ACLTeamTest extends DeleteReviewTest {

	get description () {
		return 'should return an error when someone who is not on the team tries to delete a review';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'only the author or a team admin can delete the review'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [];
			this.postOptions.creatorIndex = 1;
			callback();
		});
	}
}

module.exports = ACLTeamTest;
