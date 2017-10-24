'use strict';

var Get_Myself_Test = require('./get_myself_test');
var Get_Invited_User_Test = require('./get_invited_user_test');
var Get_Inviting_User_Test = require('./get_inviting_user_test');
var Get_Team_Member = require('./get_team_member');
var Not_Found_Test = require('./not_found_test');
var ACL_Test = require('./acl_test');

class Get_User_Request_Tester {

	get_user_test () {
		new Get_Myself_Test().test();
		new Get_Myself_Test({ id: 'me' }).test();
		new Get_Invited_User_Test().test();
		new Get_Inviting_User_Test().test();
		new Get_Team_Member().test();
		new Not_Found_Test().test();
		new ACL_Test().test();
	}
}

module.exports = Get_User_Request_Tester;
