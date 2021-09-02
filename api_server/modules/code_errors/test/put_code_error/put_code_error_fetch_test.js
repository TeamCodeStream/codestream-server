'use strict';

const PutCodeErrorTest = require('./put_code_error_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const CodeErrorTestConstants = require('../code_error_test_constants');

class PutCodeErrorFetchTest extends PutCodeErrorTest {

	get description () {
		return 'should properly update a code error when requested, checked by fetching the code error';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { codeError: CodeErrorTestConstants.EXPECTED_CODEMARK_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.updateCodeError	// perform the actual update
		], callback);
	}

	// validate that the response is correct
	validateResponse (data) {
		Assert(data.codeError.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the code error was updated');
		this.expectedCodeError.modifiedAt = data.codeError.modifiedAt;
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.codeError, this.expectedCodeError, 'fetched code error does not match');
	}
}

module.exports = PutCodeErrorFetchTest;
