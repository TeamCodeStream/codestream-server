'use strict';

const JoinTest = require('./join_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const StreamTestConstants = require('../stream_test_constants');

class JoinFetchTest extends JoinTest {

	get description () {
		return 'should properly update a stream when joined, checked by fetching the stream';
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
			this.updateStream,	// perform the actual join
			this.setFetchPath
		], callback);
	}

	setFetchPath (callback) {
		this.path = '/streams/' + this.stream._id;
		callback();
	}

	// validate that the response is correct
	validateResponse (data) {
		data.stream.memberIds.sort();
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.stream, this.expectedStream, 'fetched stream does not match');
	}
}

module.exports = JoinFetchTest;
