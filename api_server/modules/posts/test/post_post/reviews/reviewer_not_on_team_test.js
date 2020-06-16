'use strict';

const ReviewersTest = require('./reviewers_test');

class ReviewerNotOnTeamTest extends ReviewersTest {

	get description () {
		return 'should return an error when attempting to create a post with a review with a reviewer that is not on the team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'must contain only users on the team'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [0];
			callback();
		});
	}
}

module.exports = ReviewerNotOnTeamTest;
