// handle unit tests for the "PUT /users" request

'use strict';

const PostUserTest = require('./post_user_test');
const ExistingUnregisteredUserTest = require('./existing_unregistered_user_test');
const ExistingRegisteredUserTest = require('./existing_registered_user_test');
const ExistingRegisteredUserOnTeamTest = require('./existing_registered_user_on_team_test');
const ExistingUnregisteredUserOnTeamTest = require('./existing_unregistered_user_on_team_test');
const ExistingRegisteredUserAlreadyOnTeamTest = require('./existing_registered_user_already_on_team_test');
const ExistingUnregisteredUserAlreadyOnTeamTest = require('./existing_unregistered_user_already_on_team_test');
const OriginTeamPropagatesTest = require('./origin_team_propagates_test');
const ACLTest = require('./acl_test');
const NoAttributeTest = require('./no_attribute_test');
const TeamNotFoundTest = require('./team_not_found_test');
const MessageToTeamTest = require('./message_to_team_test');
const ExistingUnregisteredUserMessageToTeamTest = require('./existing_unregistered_user_message_to_team_test');
const ExistingRegisteredUserMessageToTeamTest = require('./existing_registered_user_message_to_team_test');
const UserAddedToTeamGetsMessageTest = require('./user_added_to_team_gets_message_test');
const UnregisteredInviteTest = require('./unregistered_invite_test');
const DontSendEmailTest = require('./dont_send_email_test');
const InviteEmailTest = require('./invite_email_test');
const ExistingUnregisteredInviteEmailTest = require('./existing_unregistered_invite_email_test');
const ExistingRegisteredInviteEmailTest = require('./existing_registered_invite_email_test');
const ExistingRegisteredOnTeamInviteEmailTest = require('./existing_registered_on_team_invite_email_test');
const ExistingUnregisteredOnTeamInviteEmailTest = require('./existing_unregistered_on_team_invite_email_test');
const ExistingUnregisteredAlreadyOnTeamInviteEmailTest = require('./existing_unregistered_already_on_team_invite_email_test');
const ExistingRegisteredAlreadyOnTeamInviteEmailTest = require('./existing_registered_already_on_team_invite_email_test');
/* deprecated per https://trello.com/c/nwBGfpDG
const TrackingTest = require('./tracking_test');
const TrackingRegisteredTest = require('./tracking_registered_test');
const TrackingAlreadyInvitedTest = require('./tracking_already_invited_test');
//const ProviderTrackingTest = require('./provider_tracking_test');
const NoTrackingTest = require('./no_tracking_test');
*/
//const UsernameResolutionTest = require('./username_resolution_test');
//const ExtendedUsernameResolutionTest = require('./extended_username_resolution_test');
const UsernameResolutionWithIllegalCharactersTest = require('./username_resolution_with_illegal_characters_test');
const OnlyAdminsTest = require('./only_admins_test');
const AdminsCanInviteTest = require('./admins_can_invite_test');
//const UniqueUsernameTest = require('./unique_username_test');
const DuplicateUsernameOkTest = require('./duplicate_username_ok_test');
const NumUsersInvitedTest = require('./num_users_invited_test');
const TrimEmailTest = require('./trim_email_test');
const ManualInviteTypeTest = require('./manual_invite_type_test');
const OriginUserIdTest = require('./origin_user_id_test');
const ExistingUnregisteredUserOriginUserIdTest = require('./existing_unregistered_user_origin_user_id_test');
const ExistingRegisteredUserOriginUserIdTest = require('./existing_registered_user_origin_user_id_test');
const ExistingRegisteredUserOnTeamOriginUserIdTest = require('./existing_registered_user_on_team_origin_user_id_test');
const ExistingUnregisteredUserOnTeamOriginUserIdTest = require('./existing_unregistered_user_on_team_origin_user_id_test');
const ExistingRegisteredUserAlreadyOnTeamOriginUserIdTest = require('./existing_registered_user_already_on_team_origin_user_id_test');
const MessageToUserTest = require('./message_to_user_test');
const NotCodeStreamOnlyTest = require('./not_codestream_only_test');
const NotCodeStreamOnlyDiscoveryTest = require('./not_codestream_only_discovery_test');
const NotCodeStreamOnlyDiscoveryMessageTest = require('./not_codestream_only_discovery_message_test');

const SerializeTests = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/serialize_tests');

class PostUserRequestTester {

	postUserTest () {
		new PostUserTest().test();
		new PostUserTest({ oneUserPerOrg: true }).test();
		new ExistingUnregisteredUserTest().test();
		new ExistingUnregisteredUserTest({ oneUserPerOrg: true }).test();
		new ExistingRegisteredUserTest().test();
		new ExistingRegisteredUserTest({ oneUserPerOrg: true }).test();
		new ExistingRegisteredUserOnTeamTest().test();
		new ExistingRegisteredUserOnTeamTest({ oneUserPerOrg: true }).test();
		new ExistingUnregisteredUserOnTeamTest().test();
		new ExistingUnregisteredUserOnTeamTest({ oneUserPerOrg: true }).test();
		new ExistingRegisteredUserAlreadyOnTeamTest().test();
		new ExistingRegisteredUserAlreadyOnTeamTest({ oneUserPerOrg: true }).test();
		new ExistingUnregisteredUserAlreadyOnTeamTest().test();
		new ExistingUnregisteredUserAlreadyOnTeamTest({ oneUserPerOrg: true }).test();
		new OriginTeamPropagatesTest().test();
		new ACLTest().test();
		new NoAttributeTest({ attribute: 'teamId'}).test();
		new NoAttributeTest({ attribute: 'email'}).test();
		new TeamNotFoundTest().test();
		new MessageToTeamTest().test();
		new MessageToTeamTest({ oneUserPerOrg: true }).test(); // ONE_USER_PER_ORG
		new ExistingUnregisteredUserMessageToTeamTest().test();
		new ExistingUnregisteredUserMessageToTeamTest({ oneUserPerOrg: true }).test(); // ONE_USER_PER_ORG
		new ExistingRegisteredUserMessageToTeamTest().test();
		new ExistingRegisteredUserMessageToTeamTest({ oneUserPerOrg: true }).test(); // ONE_USER_PER_ORG
		new UserAddedToTeamGetsMessageTest().test();
		new UnregisteredInviteTest().test();
		new DontSendEmailTest().test();
		// these tests must be serialized because for technical reasons the tests
		// are actually run in their "before" stage, and they will fail due to timeouts
		// if they are run in parallel
		SerializeTests([
			InviteEmailTest,
			ExistingUnregisteredInviteEmailTest,
			ExistingRegisteredInviteEmailTest,
			ExistingRegisteredOnTeamInviteEmailTest,
			ExistingUnregisteredOnTeamInviteEmailTest,
			ExistingUnregisteredAlreadyOnTeamInviteEmailTest,
			ExistingRegisteredAlreadyOnTeamInviteEmailTest
		]);
		// deprecated per https://trello.com/c/nwBGfpDG
		//new TrackingTest().test();
		//new TrackingRegisteredTest().test();
		//new TrackingAlreadyInvitedTest().test();
		//new NoTrackingTest().test();
		//new ProviderTrackingTest().test();
		//new UsernameResolutionTest().test();
		//new ExtendedUsernameResolutionTest().test();
		new UsernameResolutionWithIllegalCharactersTest().test();
		new OnlyAdminsTest().test();
		new AdminsCanInviteTest().test();
		// new UniqueUsernameTest().test();	// not an error anymore
		new DuplicateUsernameOkTest().test();
		new NumUsersInvitedTest().test();
		new TrimEmailTest().test();
		new ManualInviteTypeTest().test();
		new OriginUserIdTest().test();
		new ExistingUnregisteredUserOriginUserIdTest().test();
		new ExistingRegisteredUserOriginUserIdTest().test();
		new ExistingRegisteredUserOnTeamOriginUserIdTest().test();
		new ExistingUnregisteredUserOnTeamOriginUserIdTest().test();
		new ExistingRegisteredUserAlreadyOnTeamOriginUserIdTest().test();
		new MessageToUserTest().test();
		new NotCodeStreamOnlyTest().test();
		new NotCodeStreamOnlyDiscoveryTest().test();
		new NotCodeStreamOnlyDiscoveryMessageTest().test();
	}
}

module.exports = PostUserRequestTester;
