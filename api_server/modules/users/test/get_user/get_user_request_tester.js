// handle unit tests for the "GET /users/:id" request

'use strict';

const GetMyselfTest = require('./get_myself_test');
const GetInvitedUserTest = require('./get_invited_user_test');
const GetInvitingUserTest = require('./get_inviting_user_test');
const GetTeamMemberTest = require('./get_team_member_test');
const NotFoundTest = require('./not_found_test');
const ACLTest = require('./acl_test');
const GetMyAttributesTest = require('./get_my_attributes_test');
const GetMyselfNoMeAttributesTest = require('./get_myself_no_me_attributes_test');
const GetRemovedTeamMemberTest = require('./get_removed_team_member_test');
const ACLRemovedTeamMemberTest = require('./acl_removed_team_member_test');
const GetForeignTeamMemberTest = require('./get_foreign_team_member_test');
const ACLForeignTeamMemberTest = require('./acl_foreign_team_member_test');

class GetUserRequestTester {

	getUserTest () {
		new GetMyselfTest().test();
		new GetMyselfTest({ id: 'me' }).test();
		new GetInvitedUserTest().test();
		new GetInvitingUserTest().test();
		new GetTeamMemberTest().test();
		new NotFoundTest().test();
		new ACLTest().test();
		new GetMyAttributesTest().test();
		new GetMyselfNoMeAttributesTest().test();
		new GetRemovedTeamMemberTest().test();
		new ACLRemovedTeamMemberTest().test();
		new GetForeignTeamMemberTest().test();
		new ACLForeignTeamMemberTest().test();
	}
}

module.exports = GetUserRequestTester;
