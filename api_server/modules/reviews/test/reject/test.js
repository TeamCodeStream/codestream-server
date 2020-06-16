// handle unit tests for the "PUT /reviews/follow/:id" request to follow a review

'use strict';

const RejectTest = require('./reject_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');
const ReviewNotFoundTest = require('./review_not_found_test');
const ACLTeamTest = require('./acl_team_test');
const ACLStreamTest = require('./acl_stream_test');
const ApproveThenRejectTest = require('./approve_then_reject_test');
const ApproveThenRejectFetchTest = require('./approve_then_reject_fetch_test');
const AllReviewersMustApproveTest = require('./all_reviewers_must_approve_test');

class RejectRequestTester {

	test () {
		new RejectTest().test();
		new FetchTest().test();
		new MessageTest({ isTeamStream: true }).test();
		new MessageTest({ streamType: 'channel' }).test();
		new MessageTest({ streamType: 'direct' }).test();
		new ReviewNotFoundTest().test();
		new ACLTeamTest().test();
		new ACLStreamTest({ streamType: 'channel' }).test();
		new ACLStreamTest({ streamType: 'direct' }).test();
		new ApproveThenRejectTest().test();
		new ApproveThenRejectFetchTest().test();
		new AllReviewersMustApproveTest().test();
	}
}

module.exports = new RejectRequestTester();
