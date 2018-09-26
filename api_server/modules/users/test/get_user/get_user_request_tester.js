// handle unit tests for the "GET /users/:id" request

'use strict';

const GetMyselfTest = require('./get_myself_test');
const GetInvitedUserTest = require('./get_invited_user_test');
const GetInvitingUserTest = require('./get_inviting_user_test');
const GetTeamMember = require('./get_team_member');
const NotFoundTest = require('./not_found_test');
const ACLTest = require('./acl_test');
const GetMyAttributesTest = require('./get_my_attributes_test');
const GetMyselfNoMeAttributesTest = require('./get_myself_no_me_attributes_test');

class GetUserRequestTester {

	getUserTest () {
		new GetMyselfTest().test();
		new GetMyselfTest({ id: 'me' }).test();
		new GetInvitedUserTest().test();
		new GetInvitingUserTest().test();
		new GetTeamMember().test();
		new NotFoundTest().test();
		new ACLTest().test();
		new GetMyAttributesTest().test();
		new GetMyselfNoMeAttributesTest().test();
	}
}

module.exports = GetUserRequestTester;
