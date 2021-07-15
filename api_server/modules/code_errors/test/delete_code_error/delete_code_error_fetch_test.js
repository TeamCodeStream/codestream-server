'use strict';

const DeleteCodeErrorTest = require('./delete_code_error_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const CodeErrorTestConstants = require('../code_error_test_constants');

class DeleteCodeErrorFetchTest extends DeleteCodeErrorTest {

	get description () {
		return 'should properly deactivate a code error when deleted, checked by fetching the code error';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { codeError: CodeErrorTestConstants.EXPECTED_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.deleteCodeError	// perform the actual deletion
		], callback);
	}

	// validate that the response is correct
	validateResponse (data) {
		Assert(data.codeError.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the post was updated');
		this.expectedCodeError.modifiedAt = data.codeError.modifiedAt;
		// verify what we fetch is what we got back in the response
		Assert.deepStrictEqual(data.codeError, this.expectedCodeError, 'fetched code error does not match');
	}
}

module.exports = DeleteCodeErrorFetchTest;
