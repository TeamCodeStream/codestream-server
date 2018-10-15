'use strict';

const PutStreamTest = require('./put_stream_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const StreamTestConstants = require('../stream_test_constants');

class PutStreamFetchTest extends PutStreamTest {

	get description () {
		return 'should properly update a stream when requested, checked by fetching the stream';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { stream: StreamTestConstants.EXPECTED_STREAM_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.updateStream	// perform the actual update
		], callback);
	}

	// validate that the response is correct
	validateResponse (data) {
		// verify what we fetch is what we got back in the response
		data.stream.memberIds.sort();
		this.expectedStream.memberIds.sort();
		Assert(data.stream.modifiedAt > this.modifiedAfter, 'modifiedAt is not greater than before the stream was updated');
		this.expectedStream.modifiedAt = data.stream.modifiedAt;
		Assert.deepEqual(data.stream, this.expectedStream, 'fetched stream does not match');
	}
}

module.exports = PutStreamFetchTest;
