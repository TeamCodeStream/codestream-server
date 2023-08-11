// handle unit tests for the "PUT /deline-invite/:id" request, to decline an invite to join a company

'use strict';

const DeclineInviteTest = require('./decline_invite_test');
const CompanyNotFoundTest = require('./company_not_found_test');
const CompanyDeactivatedTest = require('./company_deactivated_test');
const ACLTest = require('./acl_test');
const MessageToTeamTest = require('./message_to_team_test');
const MessageToUserTest = require('./message_to_user_test');

class DeclineInviteRequestTester {

	test () {
 		new DeclineInviteTest().test();
		new CompanyNotFoundTest().test();
		new CompanyDeactivatedTest().test();
		new ACLTest().test();
		new MessageToTeamTest().test();
		new MessageToUserTest().test();
	}
}

module.exports = new DeclineInviteRequestTester();
