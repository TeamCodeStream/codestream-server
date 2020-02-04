// handle unit tests for the "GET /review" request to fetch a code review object

'use strict';

const GetReviewTest = require('./get_review_test');
const GetReviewWithMarkersTest = require('./get_review_with_markers_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const NotFoundTest = require('./not_found_test');

class GetReviewRequestTester {

	test () {
		new GetReviewTest().test();
		new GetReviewWithMarkersTest().test();
		new ACLTest({ type: 'direct' }).test();
		new ACLTest({ type: 'channel' }).test();
		new ACLTeamTest({ type: 'direct' }).test();
		new ACLTeamTest({ type: 'channel' }).test();
		new NotFoundTest().test();
	}
}

module.exports = new GetReviewRequestTester();
