// handle unit tests for the "POST /no-auth/register" request to register a user
'use strict';

const RegistrationTest = require('./registration_test');
const NoAttributeTest = require('./no_attribute_test');
const UserExistsTest = require('./user_exists_test');
const BadEmailTest = require('./bad_email_test');
const BadUsernameTest = require('./bad_username_test');
const BadPasswordTest = require('./bad_password_test');
const ConflictingUsernameTest = require('./conflicting_username_test');
const NoCodestreamUsernameTest = require('./no_codestream_username_test');
const UserMessageToTeamTest = require('./user_message_to_team_test');
const ConfirmationEmailTest = require('./confirmation_email_test');
// const ConfirmationEmailWithLinkTest = require('./confirmation_email_with_link_test');
const AlreadyRegisteredEmailTest = require('./already_registered_email_test');
const PreferencesTest = require('./preferences_test');
const SpecialCharactersUsernameTest = require('./special_characters_username_test');
const ReuseConfirmationCodeTest = require('./reuse_confirmation_code_test');
const NewCodeAfterReusabilityWindowTest = require('./new_code_after_reusability_window_test');
const InviteCodeTest = require('./invite_code_test');
const InviteCodeRemovedTest = require('./invite_code_removed_test');
const InviteCodeDifferentEmailTest = require('./invite_code_different_email_test');
const InviteCodeExpiredTest = require('./invite_code_expired_test');
const InviteCodeRemovedAfterUseTest = require('./invite_code_removed_after_use_test');
const AlreadyInvitedTest = require('./already_invited_test');
const InvitedUserMessageToTeamTest = require('./invited_user_message_to_team_test');

const SerializeTests = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/serialize_tests');

class RegistrationRequestTester {

	test () {
		new RegistrationTest().test();
		new NoAttributeTest({ attribute: 'email' }).test();
		new NoAttributeTest({ attribute: 'password' }).test();
		new NoAttributeTest({ attribute: 'username' }).test();
		new BadEmailTest().test();
		new BadUsernameTest().test();
		new BadPasswordTest().test();
		new UserExistsTest().test();
		new ConflictingUsernameTest().test();
		new NoCodestreamUsernameTest().test();
		new UserMessageToTeamTest().test();
		new SpecialCharactersUsernameTest().test();
		// these tests must be serialized because for technical reasons the tests
		// are actually run in their "before" stage, and they will fail due to timeouts
		// if they are run in parallel
		SerializeTests([
			ConfirmationEmailTest,
			// ConfirmationEmailWithLinkTest,
			AlreadyRegisteredEmailTest
		]);
		new PreferencesTest().test();
		new ReuseConfirmationCodeTest().test();
		new NewCodeAfterReusabilityWindowTest().test();
		new InviteCodeTest().test();
		new InviteCodeRemovedTest().test();
		new InviteCodeDifferentEmailTest().test();
		new InviteCodeExpiredTest().test();
		new InviteCodeRemovedAfterUseTest().test();
		new AlreadyInvitedTest().test();
		new InvitedUserMessageToTeamTest().test();
	}
}

module.exports = new RegistrationRequestTester();
