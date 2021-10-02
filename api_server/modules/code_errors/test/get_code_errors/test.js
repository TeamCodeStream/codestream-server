// handle unit tests for the "GET /code-errors" request to fetch error code objects

'use strict';

const GetCodeErrorsTest = require('./get_code_errors_test');
const GetCodeErrorsBeforeTest = require('./get_code_errors_before_test');
const GetCodeErrorsAfterTest = require('./get_code_errors_after_test');
const GetCodeErrorsBeforeInclusiveTest = require('./get_code_errors_before_inclusive_test');
const GetCodeErrorsAfterInclusiveTest = require('./get_code_errors_after_inclusive_test');
const GetCodeErrorsBeforeAfterTest = require('./get_code_errors_before_after_test');
const GetCodeErrorsBeforeAfterInclusiveTest = require('./get_code_errors_before_after_inclusive_test');
const ACLTest = require('./acl_test');
const TeamIDRequiredTest = require('./team_id_required_test');
const TeamNotFoundTest = require('./team_not_found_test');
const NoLastAcitivtyAtAndStreamIdTest = require('./no_last_activity_at_and_stream_id_test');
const GetCodeErrorsByLastActivityTest = require('./get_code_errors_by_last_activity_test');
const GetCodeErrorsBeforeLastActivityTest = require('./get_code_errors_before_last_activity_test');
const GetCodeErrorsAfterLastActivityTest = require('./get_code_errors_after_last_activity_test');
const GetCodeErrorsBeforeLastActivityInclusiveTest = require('./get_code_errors_before_last_activity_inclusive_test');
const GetCodeErrorsAfterLastActivityInclusiveTest = require('./get_code_errors_after_last_activity_inclusive_test');
const GetCodeErrorsBeforeAfterLastActivityTest = require('./get_code_errors_before_after_last_activity_test');
const GetCodeErrorsBeforeAfterLastActivityInclusiveTest = require('./get_code_errors_before_after_last_activity_inclusive_test');

class GetCodeErrorsRequestTester {

	test () {
		/*
		new GetCodeErrorsTest().test();
		new GetCodeErrorsBeforeTest().test();
		new GetCodeErrorsAfterTest().test();
		new GetCodeErrorsBeforeInclusiveTest().test();
		new GetCodeErrorsAfterInclusiveTest().test();
		new GetCodeErrorsBeforeAfterTest().test();
		new GetCodeErrorsBeforeAfterInclusiveTest().test();
		new ACLTest().test();
		new TeamIDRequiredTest().test();
		new TeamNotFoundTest().test();
		new NoLastAcitivtyAtAndStreamIdTest().test();
		new GetCodeErrorsByLastActivityTest().test();
		new GetCodeErrorsBeforeLastActivityTest().test();
		new GetCodeErrorsAfterLastActivityTest().test();
		new GetCodeErrorsBeforeLastActivityInclusiveTest().test();
		new GetCodeErrorsAfterLastActivityInclusiveTest().test();
		new GetCodeErrorsBeforeAfterLastActivityTest().test();
		new GetCodeErrorsBeforeAfterLastActivityInclusiveTest().test();
		*/
	}
}

module.exports = new GetCodeErrorsRequestTester();
