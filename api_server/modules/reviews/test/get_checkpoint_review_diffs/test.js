// handle unit tests for the "GET /reviews/diffs/:reviewId" request to fetch the diffs for a code review object

'use strict';

const GetCheckpointReviewDiffsTest = require('./get_checkpoint_review_diffs_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const NotFoundTest = require('./not_found_test');
const LegacyReviewDiffsTest = require('./legacy_review_diffs_test');
const GetAmendedCheckpointReviewDiffsTest = require('./get_amended_checkpoint_review_diffs_test');

class GetCheckpointReviewDiffsRequestTester {

	test () {
		new GetCheckpointReviewDiffsTest().test();
		new ACLTest({ type: 'direct' }).test();
		new ACLTest({ type: 'channel' }).test();
		new ACLTeamTest({ type: 'direct' }).test();
		new ACLTeamTest({ type: 'channel' }).test();
		new NotFoundTest().test();
		new LegacyReviewDiffsTest().test();
		new GetAmendedCheckpointReviewDiffsTest().test();
	}
}

module.exports = new GetCheckpointReviewDiffsRequestTester();
