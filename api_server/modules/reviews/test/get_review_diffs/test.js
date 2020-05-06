// handle unit tests for the "GET /reviews/diffs/:reviewId" request to fetch the diffs for a code review object

'use strict';

const GetReviewDiffsTest = require('./get_review_diffs_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const NotFoundTest = require('./not_found_test');

class GetReviewDiffsRequestTester {

	test () {
		new GetReviewDiffsTest().test();
		new ACLTest({ type: 'direct' }).test();
		new ACLTest({ type: 'channel' }).test();
		new ACLTeamTest({ type: 'direct' }).test();
		new ACLTeamTest({ type: 'channel' }).test();
		new NotFoundTest().test();
	}
}

module.exports = new GetReviewDiffsRequestTester();
