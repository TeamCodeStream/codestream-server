'use strict';

const AddReviewersFetchTest = require('./add_reviewers_fetch_test');

class AddReviewerFetchTest extends AddReviewersFetchTest {

	get description () {
		return 'should properly update a review when requested, when a reviewer is added to the review, checked by fetching the review';
	}

	// get the reviewers we want to add to the review
	getAddedUsers () {
		return [this.users[2].user];
	}
}

module.exports = AddReviewerFetchTest;
