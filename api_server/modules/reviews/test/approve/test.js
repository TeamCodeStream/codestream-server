// handle unit tests for the "PUT /reviews/follow/:id" request to follow a review

'use strict';

const ApproveTest = require('./approve_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');
const ReviewNotFoundTest = require('./review_not_found_test');
const ACLTeamTest = require('./acl_team_test');
//const ACLStreamTest = require('./acl_stream_test');
const AlreadyApprovedTest = require('./already_approved_test');
const AllReviewersMustApproveTest = require('./all_reviewers_must_approve_test');
const AllReviewersApproveTest = require('./all_reviewers_approve_test');

class ApproveRequestTester {

	test () {
		new ApproveTest().test();
		new FetchTest().test();
		new MessageTest().test();
		// NOTE - posting to streams other than the team stream is no longer allowed
		//new MessageTest({ isTeamStream: true }).test();
		//new MessageTest({ streamType: 'channel' }).test();
		//new MessageTest({ streamType: 'direct' }).test();
		new ReviewNotFoundTest().test();
		new ACLTeamTest().test();
		//new ACLStreamTest({ streamType: 'channel' }).test();
		//new ACLStreamTest({ streamType: 'direct' }).test();
		new AlreadyApprovedTest().test();
		new AllReviewersMustApproveTest().test();
		new AllReviewersApproveTest().test();
	}
}

module.exports = new ApproveRequestTester();
