// handle unit tests for the "PUT /codemarks" request to update a knowledge base codemark

'use strict';

const PutCodemarkTest = require('./put_codemark_test');
const SetPostIdTest = require('./set_post_id_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const CodemarkNotFoundTest = require('./codemark_not_found_test');
const PutCodemarkFetchTest = require('./put_codemark_fetch_test');
const NoUpdateOtherAttributeTest = require('./no_update_other_attribute_test');
const NoUpdatePostIdTest = require('./no_update_post_id_test');
const NoUpdateStreamIdTest = require('./no_update_stream_id_test');
const NoStreamIdTest = require('./no_stream_id_test');
const MessageTest = require('./message_test');
const ProviderTypeMessageTest = require('./provider_type_message_test');
const UpdateMarkerTest = require('./update_marker_test');
const UpdateMarkerFetchTest = require('./update_marker_fetch_test');
const UpdateMarkerMessageTest = require('./update_marker_message_test');
const RequiredForTypeTest = require('./required_for_type_test');
const SetAssigneesTest = require('./set_assignees_test');
const ClearAssigneesTest = require('./clear_assignees_test');
const InvalidAssigneeTest = require('./invalid_assignee_test');
const AssigneeNotOnTeamTest = require('./assignee_not_on_team_test');
const AssigneesIgnoredTest = require('./assignees_ignored_test');
const SetPostlessAssigneesTest = require('./set_postless_assignees_test');
const UpdatePostlessAssigneesTest = require('./update_postless_assignees_test');
const SetParentPostIdTest = require('./set_parent_post_id_test');

class PutCodemarkRequestTester {

	test () {
		new PutCodemarkTest().test();
		new SetPostIdTest().test();
		new ACLTest().test();
		new ACLTeamTest().test();
		new CodemarkNotFoundTest().test();
		new PutCodemarkFetchTest().test();
		new NoUpdateOtherAttributeTest({ attribute: 'type' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'markerIds' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'teamId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'providerType' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'parentPostId' }).test();
		new NoUpdatePostIdTest().test();
		new NoUpdateStreamIdTest().test();
		new NoStreamIdTest().test();
		new MessageTest({ streamType: 'channel' }).test();
		new MessageTest({ streamType: 'direct' }).test();
		new MessageTest({ streamType: 'team stream' }).test();
		new ProviderTypeMessageTest({ streamType: 'channel' }).test();
		new ProviderTypeMessageTest({ streamType: 'direct' }).test();
		new ProviderTypeMessageTest({ streamType: 'team stream' }).test();
		new UpdateMarkerTest().test();
		new UpdateMarkerFetchTest().test();
		new UpdateMarkerMessageTest({ streamType: 'channel' }).test();
		new UpdateMarkerMessageTest({ streamType: 'direct' }).test();
		new UpdateMarkerMessageTest({ streamType: 'team stream' }).test();
		new RequiredForTypeTest({ codemarkType: 'comment', attribute: 'text' }).test();
		new RequiredForTypeTest({ codemarkType: 'bookmark', attribute: 'text', wantMarker: true }).test();
		new RequiredForTypeTest({ codemarkType: 'trap', attribute: 'text', wantMarker: true }).test();
		new RequiredForTypeTest({ codemarkType: 'question', attribute: 'title' }).test();
		new RequiredForTypeTest({ codemarkType: 'issue', attribute: 'title' }).test();
		new SetAssigneesTest().test();
		new ClearAssigneesTest().test();
		new InvalidAssigneeTest().test();
		new AssigneeNotOnTeamTest().test();
		new AssigneesIgnoredTest().test();
		new SetPostlessAssigneesTest().test();
		new UpdatePostlessAssigneesTest().test();
		new SetParentPostIdTest().test();
	}
}

module.exports = new PutCodemarkRequestTester();
