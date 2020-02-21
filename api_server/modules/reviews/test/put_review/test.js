// handle unit tests for the "PUT /reviews" request to update a knowledge base review

'use strict';

const PutReviewTest = require('./put_review_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const ReviewNotFoundTest = require('./review_not_found_test');
const PutReviewFetchTest = require('./put_review_fetch_test');
const NoUpdateOtherAttributeTest = require('./no_update_other_attribute_test');
const MessageTest = require('./message_test');
const TeamMemberUpdateIssueStatusTest = require('./team_member_update_issue_status_test');
const UpdateStatusACLTest = require('./update_status_acl_test');

class PutReviewRequestTester {

	test () {
		new PutReviewTest().test();
		new ACLTest().test();
		new ACLTeamTest().test();
		new ReviewNotFoundTest().test();
		new PutReviewFetchTest().test();
		new NoUpdateOtherAttributeTest({ attribute: 'reviewers' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'tags' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'teamId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'postId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'streamId' }).test();
		new MessageTest({ streamType: 'channel' }).test();
		new MessageTest({ streamType: 'direct' }).test();
		new MessageTest({ streamType: 'team stream' }).test();
		new TeamMemberUpdateIssueStatusTest().test();
		new UpdateStatusACLTest().test();
	}
}

module.exports = new PutReviewRequestTester();
