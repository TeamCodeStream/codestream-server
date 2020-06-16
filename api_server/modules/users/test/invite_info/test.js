// handle unit tests for the "GET /no-auth/invite-info" request,
// to handle getting info associated with a particular invite code
// authorization flow
 
'use strict';

const InviteInfoTest = require('./invite_info_test');
const CodeRequiredTest = require('./code_required_test');
const IncorrectCodeTest = require('./incorrect_code_test');
const TokenExpiredTest = require('./token_expired_test');
const UserNotFoundTest = require('./user_not_found_test');
const TeamNotFoundTest = require('./team_not_found_test');

class InviteInfoRequestTester {

	test () {
		new InviteInfoTest().test();
		new CodeRequiredTest().test();
		new IncorrectCodeTest().test();
		new TokenExpiredTest().test();
		new UserNotFoundTest().test();
		new TeamNotFoundTest().test();
	}
}

module.exports = new InviteInfoRequestTester();
