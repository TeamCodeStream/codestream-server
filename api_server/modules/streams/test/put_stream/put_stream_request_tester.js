// handle unit tests for the "PUT /streams" request

'use strict';

const PutStreamTest = require('./put_stream_test');
const PutStreamFetchTest = require('./put_stream_fetch_test');
const StreamNotFoundTest = require('./stream_not_found_test');
const NoUpdateNonChannelStreamTest = require('./no_update_non_channel_stream_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const CanUpdateTeamStream = require('./can_update_team_stream_test');
const NoUpdateOtherAttributeTest = require('./no_update_other_attribute_test');
const MemberIdsNotArrayTest = require('./member_ids_not_array_test');
const AddUserTest = require('./add_user_test');
const AddUserFetchTest = require('./add_user_fetch_test');
const AddUsersTest = require('./add_users_test');
const AddUsersFetchTest = require('./add_users_fetch_test');
const RemoveUserTest = require('./remove_user_test');
const RemoveUserFetchTest = require('./remove_user_fetch_test');
const RemoveUsersTest = require('./remove_users_test');
const RemoveUsersFetchTest = require('./remove_users_fetch_test');
const PushBecomesAddToSetTest = require('./push_becomes_addtoset_test');
const PushMergesToAddToSetTest = require('./push_merges_to_addtoset_test');
const NoPushPullTest = require('./no_push_pull_test');
const NoChangeMembersOfTeamStreamTest = require('./no_change_members_of_team_stream_test');
const MessageToStreamTest = require('./message_to_stream_test');
const AddUserMessageToStreamTest = require('./add_user_message_to_stream_test');
const RemoveUserMessageToStreamTest = require('./remove_user_message_to_stream_test');
const MessageToTeamTest = require('./message_to_team_test');
const AddUserMessageToTeamTest = require('./add_user_message_to_team_test');
const RemoveUserMessageToTeamTest = require('./remove_user_message_to_team_test');
const SubscriptionTest = require('./subscription_test');
const UserGetsStreamMessageTest = require('./user_gets_stream_message_test');

class PutStreamRequestTester {

	putStreamTest () {
		new PutStreamTest().test();
		new PutStreamFetchTest().test();
		new StreamNotFoundTest().test();
		new NoUpdateNonChannelStreamTest({ type: 'direct' }).test();
		new NoUpdateNonChannelStreamTest({ type: 'file' }).test();
		new ACLTest().test();
		new ACLTeamTest().test();
		new CanUpdateTeamStream().test();
		new NoUpdateOtherAttributeTest({ attribute: 'teamId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'repoId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'type' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'memberIds' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'isTeamStream' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'mostRecentPostId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'sortId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'numMarkers' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'editingUsers' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'privacy' }).test();
		new MemberIdsNotArrayTest().test();
		new AddUserTest().test();
		new AddUserFetchTest().test();
		new AddUsersTest().test();
		new AddUsersFetchTest().test();
		new RemoveUserTest().test();
		new RemoveUserFetchTest().test();
		new RemoveUsersTest().test();
		new RemoveUsersFetchTest().test();
		new PushBecomesAddToSetTest().test();
		new PushMergesToAddToSetTest().test();
		new NoPushPullTest().test();
		new NoChangeMembersOfTeamStreamTest().test();
		new MessageToStreamTest().test();
		new AddUserMessageToStreamTest().test();
		new RemoveUserMessageToStreamTest().test();
		new MessageToTeamTest().test();
		new AddUserMessageToTeamTest().test();
		new RemoveUserMessageToTeamTest().test();
		new SubscriptionTest().test();
		//new SubscriptionRevokedTest().test();	// Putting this off till we support removing members
		new UserGetsStreamMessageTest().test();
	}
}

module.exports = PutStreamRequestTester;
