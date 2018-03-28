// handle unit tests for the "PUT /users" request

'use strict';

const PostUserTest = require('./post_user_test');
const ExistingUnregisteredUserTest = require('./existing_unregistered_user_test');
const ExistingRegisteredUserTest = require('./existing_registered_user_test');
const ExistingRegisteredUserOnTeamTest = require('./existing_registered_user_on_team_test');
const ExistingUnegisteredUserOnTeamTest = require('./existing_unregistered_user_on_team_test');
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

const SerializeTests = require(process.env.CS_API_TOP + '/lib/test_base/serialize_tests');

class PostUserRequestTester {

	postUserTest () {
		new PostUserTest().test();
		new ExistingUnregisteredUserTest().test();
		new ExistingRegisteredUserTest().test();
		new ExistingRegisteredUserOnTeamTest().test();
		new ExistingUnegisteredUserOnTeamTest().test();
		new ExistingRegisteredUserAlreadyOnTeamTest().test();
		new ExistingUnregisteredUserAlreadyOnTeamTest().test();
		new OriginTeamPropagatesTest().test();
		new ACLTest().test();
		new NoAttributeTest({ attribute: 'teamId'}).test();
		new NoAttributeTest({ attribute: 'email'}).test();
		new TeamNotFoundTest().test();
		new MessageToTeamTest().test();
		new ExistingUnregisteredUserMessageToTeamTest().test();
		new ExistingRegisteredUserMessageToTeamTest().test();
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
	}
}

module.exports = PostUserRequestTester;
