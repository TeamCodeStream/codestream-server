// handle unit tests for the "GET /code-error" request to fetch a code error object

'use strict';

const GetCodeErrorTest = require('./get_code_error_test');
const GetCodeErrorWithMarkersTest = require('./get_code_error_with_markers_test');
const ACLTeamTest = require('./acl_team_test');
const NotFoundTest = require('./not_found_test');

class GetCodeErrorRequestTester {

	test () {
		new GetCodeErrorTest().test();
		new GetCodeErrorWithMarkersTest().test();
		new ACLTeamTest({ type: 'direct' }).test();
		new ACLTeamTest({ type: 'channel' }).test();
		new NotFoundTest().test();
	}
}

module.exports = new GetCodeErrorRequestTester();
