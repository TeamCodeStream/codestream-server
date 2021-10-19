// handle unit tests for the "GET /code-errors" request to fetch error code objects

'use strict';

const GetCodeErrorsTest = require('./get_code_errors_test');
const GetCodeErrorsBeforeTest = require('./get_code_errors_before_test');
const GetCodeErrorsAfterTest = require('./get_code_errors_after_test');
const GetCodeErrorsBeforeInclusiveTest = require('./get_code_errors_before_inclusive_test');
const GetCodeErrorsAfterInclusiveTest = require('./get_code_errors_after_inclusive_test');
const GetCodeErrorsBeforeAfterTest = require('./get_code_errors_before_after_test');
const GetCodeErrorsBeforeAfterInclusiveTest = require('./get_code_errors_before_after_inclusive_test');

class GetCodeErrorsRequestTester {

	test () {
		new GetCodeErrorsTest().test();
		new GetCodeErrorsBeforeTest().test();
		new GetCodeErrorsAfterTest().test();
		new GetCodeErrorsBeforeInclusiveTest().test();
		new GetCodeErrorsAfterInclusiveTest().test();
		new GetCodeErrorsBeforeAfterTest().test();
		new GetCodeErrorsBeforeAfterInclusiveTest().test();
	}
}

module.exports = new GetCodeErrorsRequestTester();
