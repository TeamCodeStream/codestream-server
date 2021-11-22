'use strict';

const ClaimCodeErrorTest = require('./claim_code_error_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const CodeErrorTestConstants = require('../code_error_test_constants');
const CodeErrorValidator = require('../code_error_validator');

class FetchCodeErrorTest extends ClaimCodeErrorTest {

	get description () {
		return 'should properly update a code error when claimed, checked by fetching the code error';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { codeError: CodeErrorTestConstants.EXPECTED_CODE_ERROR_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.claimCodeError	// perform the actual claim
		], callback);
	}

	claimCodeError (callback) {
		super.claimCodeError(error => {
			if (error) { return callback(error); }
			this.path = '/code-errors/' + this.nrCommentResponse.codeStreamResponse.codeError.id;
			callback();
		});
	}

	// validate that the response is correct
	validateResponse (data) {
		// since the permalink is generated, we need to validate that then we'll copy in
		// so the deep-equal works
		new CodeErrorValidator({ test: this }).validatePermalink(data.codeError.permalink);
		this.expectedCodeError.permalink = data.codeError.permalink;

		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.codeError, this.expectedCodeError, 'fetched code error does not match');
		Assert.deepEqual(data.post, this.expectedPost, 'fetched post does not match');

		// verify the code error in the response has no attributes that should not go to clients
		this.validateSanitized(data.codeError, CodeErrorTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = FetchCodeErrorTest;
