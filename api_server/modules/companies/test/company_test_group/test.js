// handle unit tests for the "PUT /company-test-group/:id" request, to save randomized test group info for a company

'use strict';

const CompanyTestGroupTest = require('./company_test_group_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');
const CompanyNotFoundTest = require('./company_not_found_test');
const ACLTest = require('./acl_test');
const TooManyKeysTest = require('./too_many_keys_test');
//const OtherTeamMessageTest = require('./other_team_message_test');

class CompanyTestGroupRequestTester {

	test () {
		new CompanyTestGroupTest().test();
		new FetchTest().test();
		new MessageTest().test();
		new CompanyNotFoundTest().test();
		new ACLTest().test();
		new TooManyKeysTest().test();
		//new OtherTeamMessageTest().test();
	}
}

module.exports = new CompanyTestGroupRequestTester();
