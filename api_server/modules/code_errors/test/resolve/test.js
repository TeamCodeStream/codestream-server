// handle unit tests for the "PUT /code-errors/follow/:id" request to follow a code error

'use strict';

const ResolveTest = require('./resolve_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');
const CodeErrorNotFoundTest = require('./code_error_not_found_test');
const ACLTeamTest = require('./acl_team_test');
const AlreadyResolvedTest = require('./already_resolved_test');

class ResolveRequestTester {

	test () {
		new ResolveTest().test();
		new FetchTest().test();
		new MessageTest().test();
		new CodeErrorNotFoundTest().test();
		new ACLTeamTest().test();
		new AlreadyResolvedTest().test();
	}
}

module.exports = new ResolveRequestTester();
