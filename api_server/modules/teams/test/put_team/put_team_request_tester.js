// handle unit tests for the "PUT /teams/:id" request to update a team

'use strict';

const PutTeamTest = require('./put_team_test');
const PutTeamFetchTest = require('./put_team_fetch_test');
const ACLTest = require('./acl_test');
const TeamNotFoundTest = require('./team_not_found_test');
const MessageToTeamTest = require('./message_to_team_test');
const NoUpdateOtherAttributeTest = require('./no_update_other_attribute_test');
const RemoveUserTest = require('./remove_user_test');
const RemoveUsersTest = require('./remove_users_test');
const RemoveAdminTest = require('./remove_admin_test');
const RemoveAdminsTest = require('./remove_admins_test');
const NoPushPullTest = require('./no_push_pull_test');
const NoRemoveUserAndAdminTest = require('./no_remove_user_and_admin_test');
const NoRemoveUserAndAddAdminTest = require('./no_remove_user_and_add_admin_test');
const AddAdminTest = require('./add_admin_test');
const AddAdminsTest = require('./add_admins_test');
const PushBecomesAddToSetTest = require('./push_becomes_add_to_set_test');
const NoPushUsersTest = require('./no_push_users_test');
const NoAddUsersTest = require('./no_add_users_test');
const MemberIdsNotArrayTest = require('./member_ids_not_array_test');
const AdminIdsNotArrayTest = require('./admin_ids_not_array_test');
const AddAdminIdsNotArrayTest = require('./add_admin_ids_not_array_test');
const NoRemoveSelfTest = require('./no_remove_self_test');
const AdminAddAdminsTest = require('./admin_add_admins_test');
const AdminRemoveAdminsTest = require('./admin_remove_admins_test');
const AdminRemoveUsersTest = require('./admin_remove_users_test');
const UsersNotFound = require('./users_not_found_test');
const UsersNotOnTeamTest = require('./users_not_on_team_test');
const UsersRemovedTest = require('./users_removed_test');
const TeamSubscriptionRevokedTest = require('./team_subscription_revoked_test');
//const NoMoreTeamMessagesTest = require('./no_more_team_messages_test');
const RemovalMessageToUserTest = require('./removal_message_to_user_test');
const UninvitedUserCanRegisterTest = require('./uninvited_user_can_register_test');

class PutTeamRequestTester {

	putTeamTest () {
		new PutTeamTest().test();
		new PutTeamFetchTest().test();
		new ACLTest().test();
		new TeamNotFoundTest().test();
		new MessageToTeamTest().test();
		new NoUpdateOtherAttributeTest({ attribute: 'companyId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'memberIds' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'integrations' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'primaryReferral' }).test();
		new RemoveUserTest().test();
		new RemoveUsersTest().test();
		new RemoveAdminTest().test();
		new RemoveAdminsTest().test();
		new NoPushPullTest().test();
		new NoRemoveUserAndAdminTest().test();
		new NoRemoveUserAndAddAdminTest().test();
		new AddAdminTest().test();
		new AddAdminsTest().test();
		new PushBecomesAddToSetTest().test();
		new NoPushUsersTest().test();
		new NoAddUsersTest().test();
		new MemberIdsNotArrayTest().test();
		new AdminIdsNotArrayTest().test();
		new AddAdminIdsNotArrayTest().test();
		new NoRemoveSelfTest().test();
		new AdminAddAdminsTest().test();
		new AdminRemoveAdminsTest().test();
		new AdminRemoveUsersTest().test();
		new UsersNotFound().test();
		new UsersNotOnTeamTest().test();
		new UsersRemovedTest().test();
		new TeamSubscriptionRevokedTest().test();
		// new NoMoreTeamMessagesTest().test(); // Disabled pending resolution of https://support.pubnub.com/support/tickets/7939 (>sigh<)
		new RemovalMessageToUserTest().test();
		new UninvitedUserCanRegisterTest().test();
	}
}

module.exports = PutTeamRequestTester;
