'use strict';

const RemoveReviewersFetchTest = require('./remove_assignees_fetch_test');

class RemoveReviewerFetchTest extends RemoveReviewersFetchTest {

	get description () {
		return 'should properly update a review when requested, when a reviewer is removed from the review, checked by fetching the review';
	}

	// get the reviewers we want to remove from the review
	getRemovedReviewers () {
		return [this.users[2].user];
	}
}

module.exports = RemoveReviewerFetchTest;
