'use strict';

const ClaimCodeErrorTest = require('./claim_code_error_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const StreamTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/streams/test/stream_test_constants');

class FetchStreamTest extends ClaimCodeErrorTest {

	get description () {
		return 'should properly update the stream for a code error when claimed, checked by fetching the stream';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { stream: StreamTestConstants.EXPECTED_OBJECT_STREAM_FIELDS };
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
			this.path = '/streams/' + this.nrCommentResponse.codeStreamResponse.codeError.streamId;
			callback();
		});
	}

	// validate that the response is correct
	validateResponse (data) {
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.stream, this.expectedStream, 'fetched stream does not match');

		// verify the code error in the response has no attributes that should not go to clients
		this.validateSanitized(data.stream, StreamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = FetchStreamTest;
