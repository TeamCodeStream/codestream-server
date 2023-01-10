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
const NoAddUsersTest = require('./no_add_users_test');
const RemovedMemberIdsNotArrayTest = require('./removed_member_ids_not_array_test');
const AdminIdsNotArrayTest = require('./admin_ids_not_array_test');
const AddAdminIdsNotArrayTest = require('./add_admin_ids_not_array_test');
const AdminAddAdminsTest = require('./admin_add_admins_test');
const AdminRemoveAdminsTest = require('./admin_remove_admins_test');
const AdminRemoveUsersTest = require('./admin_remove_users_test');
const UsersNotFound = require('./users_not_found_test');
const UsersNotOnTeamTest = require('./users_not_on_team_test');
const UserDeactivated = require('./user_deactivated_test');
const UserDisabledTest = require('./user_disabled_test');
const TeamSubscriptionRevokedTest = require('./team_subscription_revoked_test');
//const NoMoreTeamMessagesTest = require('./no_more_team_messages_test');
const RemovalMessageToUserTest = require('./removal_message_to_user_test');
const UninvitedUserCanRegisterTest = require('./uninvited_user_can_register_test');
const RemoveSelfTest = require('./remove_self_test');
const RemoveSelfUnifiedIdentityTest = require('./remove_self_unified_identity_test');
const RemoveUserMessageToTeamTest = require('./remove_user_message_to_team_test');
const ReinviteRemovedUserTest = require('./reinvite_removed_user_test');
const RemovedUsersNotInCompanyMemberCountTest = require('./removed_users_not_in_company_member_count_test');
//const UnregisteredOnTwoTeamsTest = require('./unregistered_on_two_teams_test');
const MessageToInviteeTest = require('./message_to_invitee_test');
const NotCodeStreamOnlyTest = require('./not_codestream_only_test');
const NotCodeStreamOnlyDiscoveryTest = require('./not_codestream_only_discovery_test');
const NotCodeStreamOnlyDiscoveryMessageTest = require('./not_codestream_only_discovery_message_test');
const NotCodeStreamOnlyAddAdminTest = require('./not_codestream_only_add_admin_test');
const NotCodeStreamOnlyDiscoveryAddAdminTest = require('./not_codestream_only_discovery_add_admin_test');
const NotCodeStreamOnlyDiscoveryMessageAddAdminTest = require('./not_codestream_only_discovery_message_add_admin_test');
const NotCodeStreamOnlyRemoveAdminTest = require('./not_codestream_only_remove_admin_test');
const NotCodeStreamOnlyDiscoveryRemoveAdminTest = require('./not_codestream_only_discovery_remove_admin_test');
const NotCodeStreamOnlyDiscoveryMessageRemoveAdminTest = require('./not_codestream_only_discovery_message_remove_admin_test');

class PutTeamRequestTester {

	putTeamTest () {
		new PutTeamTest().test();
		new PutTeamTest({ unifiedIdentityEnabled: true }).test();
		new PutTeamFetchTest().test();
		new ACLTest().test();
		new TeamNotFoundTest().test();
		new MessageToTeamTest().test();
		new NoUpdateOtherAttributeTest({ attribute: 'companyId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'memberIds' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'integrations' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'primaryReferral' }).test();
		new RemoveUserTest().test();
		new RemoveUserTest({ unifiedIdentityEnabled: true }).test();
		new RemoveUsersTest().test();
		new RemoveAdminTest().test();
		new RemoveAdminsTest().test();
		new NoPushPullTest().test();
		new NoRemoveUserAndAdminTest().test();
		new NoRemoveUserAndAddAdminTest().test();
		new AddAdminTest().test();
		new AddAdminsTest().test();
		new PushBecomesAddToSetTest().test();
		new NoAddUsersTest().test();
		new RemovedMemberIdsNotArrayTest().test();
		new AdminIdsNotArrayTest().test();
		new AddAdminIdsNotArrayTest().test();
		new AdminAddAdminsTest().test();
		new AdminRemoveAdminsTest().test();
		new AdminRemoveUsersTest().test();
		new UsersNotFound().test();
		new UsersNotOnTeamTest().test();
		new UserDeactivated().test();
		new UserDisabledTest().test();
		new TeamSubscriptionRevokedTest().test();
		// new NoMoreTeamMessagesTest().test(); // Disabled pending resolution of https://support.pubnub.com/support/tickets/7939 (>sigh<)
		new RemovalMessageToUserTest().test();
		new UninvitedUserCanRegisterTest().test();
		new RemoveSelfTest().test();
		new RemoveSelfUnifiedIdentityTest().test();
		new RemoveUserMessageToTeamTest().test();
		new ReinviteRemovedUserTest().test();
		new RemovedUsersNotInCompanyMemberCountTest().test();
		//new UnregisteredOnTwoTeamsTest().test(); // Deprecated per one-user-per-org
		new MessageToInviteeTest().test();
		new NotCodeStreamOnlyTest().test();
		new NotCodeStreamOnlyDiscoveryTest().test();
		new NotCodeStreamOnlyDiscoveryMessageTest().test();
		new NotCodeStreamOnlyAddAdminTest().test();
		new NotCodeStreamOnlyDiscoveryAddAdminTest().test();
		new NotCodeStreamOnlyDiscoveryMessageAddAdminTest().test();
		new NotCodeStreamOnlyRemoveAdminTest().test();
		new NotCodeStreamOnlyDiscoveryRemoveAdminTest().test();
		new NotCodeStreamOnlyDiscoveryMessageRemoveAdminTest().test();
	}
}

module.exports = PutTeamRequestTester;
