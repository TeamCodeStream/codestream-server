'use strict';

var GetMyselfTest = require('./get_myself_test');
var GetInvitedUserTest = require('./get_invited_user_test');
var GetInvitingUserTest = require('./get_inviting_user_test');
var GetTeamMember = require('./get_team_member');
var NotFoundTest = require('./not_found_test');
var ACLTest = require('./acl_test');
var GetMyAttributesTest = require('./get_my_attributes_test');
var GetMyselfNoMeAttributesTest = require('./get_myself_no_me_attributes_test');

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
