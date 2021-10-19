// handle unit tests for the "PUT /code-errors" request to update a code error

'use strict';

const PutCodeErrorTest = require('./put_code_error_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const CodeErrorNotFoundTest = require('./code_error_not_found_test');
const PutCodeErrorFetchTest = require('./put_code_error_fetch_test');
const NoUpdateOtherAttributeTest = require('./no_update_other_attribute_test');
const MessageTest = require('./message_test');

class PutCodeErrorRequestTester {

	test () {
		new PutCodeErrorTest().test();
		new ACLTest().test();
		new ACLTeamTest().test();
		new CodeErrorNotFoundTest().test();
		new PutCodeErrorFetchTest().test();
		new NoUpdateOtherAttributeTest({ attribute: 'teamId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'postId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'streamId' }).test();
		new MessageTest().test();
	}
}

module.exports = new PutCodeErrorRequestTester();
