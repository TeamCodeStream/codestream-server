'use strict';

const AddReviewersTest = require('./add_reviewers_test');

class ReviewersNotOnTeamTest extends AddReviewersTest {

	get description () {
		return 'should return an error when trying to add reviewers to a review when one or more of the reviewers aren\'t on the team that owns the review';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
    
	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [0, 1];
			callback();
		});
	}
}

module.exports = ReviewersNotOnTeamTest;
