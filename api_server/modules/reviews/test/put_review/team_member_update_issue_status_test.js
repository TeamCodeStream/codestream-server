'use strict';

const PutReviewTest = require('./put_review_test');
const RandomString = require('randomstring');

class TeamMemberUpdateIssueStatusTest extends PutReviewTest {

	get description () {
		return 'a team member should be able to update an issue\'s status';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			callback();
		});
	}

	getReviewUpdateData () {
		return {
			status: RandomString.generate(8)
		};
	}
}

module.exports = TeamMemberUpdateIssueStatusTest;
