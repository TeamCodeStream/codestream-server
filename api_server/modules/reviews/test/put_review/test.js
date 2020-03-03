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
const AddReviewerTest = require('./add_reviewer_test');
const AddReviewersTest = require('./add_reviewers_test');
const AddReviewersFetchTest = require('./add_reviewers_fetch_test');
const AddReviewerFetchTest = require('./add_reviewer_fetch_test');
const AddReviewerMessageTest = require('./add_reviewer_message_test');
const RemoveReviewerTest = require('./remove_reviewer_test');
const RemoveReviewersTest = require('./remove_reviewers_test');
const RemoveReviewersFetchTest = require('./remove_reviewers_fetch_test');
const RemoveReviewerFetchTest = require('./remove_reviewer_fetch_test');
const PushBecomesAddToSetTest = require('./push_becomes_addtoset_test');
const PushMergesToAddToSetTest = require('./push_merges_to_addtoset_test');
const ReviewersNotArrayTest = require('./reviewers_not_array_test');
const RemoveReviewerMessageTest = require('./remove_reviewer_message_test');
const ReviewersNotFound = require('./reviewers_not_found_test');
const ReviewersNotOnTeamTest = require('./reviewers_not_on_team_test');
const AddRemoveReviewersTest = require('./add_remove_reviewers_test');
const AddRemoveReviewersFetchTest = require('./add_remove_reviewers_fetch_test');
const NoAddRemoveSameReviewerTest = require('./no_add_remove_same_reviewer_test');

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
		new AddReviewerTest().test();
		new AddReviewersTest().test();
		new AddReviewersFetchTest().test();
		new AddReviewerFetchTest().test();
		new AddReviewerMessageTest({ streamType: 'channel' }).test();
		new AddReviewerMessageTest({ streamType: 'direct' }).test();
		new AddReviewerMessageTest({ streamType: 'team stream' }).test();
		new RemoveReviewerTest().test();
		new RemoveReviewersTest().test();
		new RemoveReviewersFetchTest().test();
		new RemoveReviewerFetchTest().test();
		new PushBecomesAddToSetTest().test();
		new PushMergesToAddToSetTest().test();
		new ReviewersNotArrayTest().test();
		new RemoveReviewerMessageTest({ streamType: 'channel' }).test();
		new RemoveReviewerMessageTest({ streamType: 'direct' }).test();
		new RemoveReviewerMessageTest({ streamType: 'team stream' }).test();
		new ReviewersNotFound().test();
		new ReviewersNotOnTeamTest().test();
		new AddRemoveReviewersTest().test();
		new AddRemoveReviewersFetchTest().test();
		new NoAddRemoveSameReviewerTest().test();
	}
}

module.exports = new PutReviewRequestTester();
