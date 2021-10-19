// handle unit tests for the "GET /users" request

'use strict';

const GetUsersByIdTest = require('./get_users_by_id_test');
const TeamIDRequiredTest = require('./team_id_required_test');
const GetUsersByTeamIdTest = require('./get_users_by_team_id_test');
const ACLTest = require('./acl_test');
const GetUsersOnlyFromTeamTest = require('./get_users_only_from_team_test');
const GetDeactivatedUsersTest = require('./get_deactivated_users_test');
const GetRemovedUsersTest = require('./get_removed_users_test');
const GetCodeErrorFollowersTest = require('./get_code_error_followers_test');
const CodeErrorNotFoundTest = require('./code_error_not_found_test');
const ACLCodeErrorTest = require('./acl_code_error_test');

class GetUsersRequestTester {

	getUsersTest () {
		new GetUsersByIdTest().test();
		new GetUsersByTeamIdTest().test();
		new TeamIDRequiredTest().test();
		new ACLTest().test();
		new GetUsersOnlyFromTeamTest().test();
		new GetDeactivatedUsersTest().test();
		new GetRemovedUsersTest().test();
		new GetCodeErrorFollowersTest().test();
		new CodeErrorNotFoundTest().test();
		new ACLCodeErrorTest().test();
	}
}

module.exports = GetUsersRequestTester;
