// handle unit tests for the "PUT /code-errors" request to update a code error

'use strict';

const PutCodeErrorTest = require('./put_code_error_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const CodeErrorNotFoundTest = require('./code_error_not_found_test');
const PutCodeErrorFetchTest = require('./put_code_error_fetch_test');
const NoUpdateOtherAttributeTest = require('./no_update_other_attribute_test');
const MessageTest = require('./message_test');
const TeamMemberUpdateIssueStatusTest = require('./team_member_update_issue_status_test');
const UpdateStatusACLTest = require('./update_status_acl_test');
/*
const AddAsigneeTest = require('./add_assignee_test');
const AddAssigneesTest = require('./add_assignee_test');
const AddAssigneesFetchTest = require('./add_assignees_fetch_test');
const AddAssigneeFetchTest = require('./add_assignee_fetch_test');
const AddAssigneeMessageTest = require('./add_assignee_message_test');
const RemoveAssigneeTest = require('./remove_assignee_test');
const RemoveAssigneesTest = require('./remove_assignee_test');
const RemoveAssignesFetchTest = require('./remove_assignee_fetch_test');
const RemoveAssigneeFetchTest = require('./remove_assignee_fetch_test');
const PushBecomesAddToSetTest = require('./push_becomes_addtoset_test');
const PushMergesToAddToSetTest = require('./push_merges_to_addtoset_test');
const AssigneesNotArrayTest = require('./assignees_not_array_test');
const RemoveAssigneeMessageTest = require('./remove_assignee_message_test');
const AssigneesNotFound = require('./assignees_not_found_test');
const AssigneesNotOnTeamTest = require('./assignees_not_on_team_test');
const AddRemoveAssigneesTest = require('./add_remove_assignees_test');
const AddRemoveAssigneesFetchTest = require('./add_remove_assignees_fetch_test');
const NoAddRemoveSameAssigneeTest = require('./no_add_remove_same_assignee_test');
*/
const ResolvedAtTest = require('./resolved_at_test');
const TicketTest = require('./ticket_test');

class PutCodeErrorRequestTester {

	test () {
		new PutCodeErrorTest().test();
		new ACLTest().test();
		new ACLTeamTest().test();
		new CodeErrorNotFoundTest().test();
		new PutCodeErrorFetchTest().test();
		new NoUpdateOtherAttributeTest({ attribute: 'assignees' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'teamId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'postId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'streamId' }).test();
		new MessageTest().test();
		new TeamMemberUpdateIssueStatusTest().test();
		new UpdateStatusACLTest().test();
		/*
		new AddAssigneeTest().test();
		new AddAssigneesTest().test();
		new AddAssigneesFetchTest().test();
		new AddAssigneeFetchTest().test();
		new AddAssigneeMessageTest().test();
		new RemoveAssigneeTest().test();
		new RemoveAssigneesTest().test();
		new RemoveAssigneesFetchTest().test();
		new RemoveAssigneeFetchTest().test();
		new PushBecomesAddToSetTest().test();
		new PushMergesToAddToSetTest().test();
		new AssigneesNotArrayTest().test();
		new RemoveAssigneeMessageTest().test();
		new AssigneesNotFound().test();
		new AssigneesNotOnTeamTest().test();
		new AddRemoveAssigneesTest().test();
		new AddRemoveAssigneesFetchTest().test();
		new NoAddRemoveSameAssigneeTest().test();
		*/
		new ResolvedAtTest().test();
		new TicketTest().test();
	}
}

module.exports = new PutCodeErrorRequestTester();
