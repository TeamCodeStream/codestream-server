// handle unit tests for the "GET /code-error" request to fetch a code error object

'use strict';

const GetCodeErrorTest = require('./get_code_error_test');
const ACLTest = require('./acl_test');
const NotFoundTest = require('./not_found_test');

class GetCodeErrorRequestTester {

	test () {
		new GetCodeErrorTest().test();
		new ACLTest().test();
		new NotFoundTest().test();
	}
}

module.exports = new GetCodeErrorRequestTester();
