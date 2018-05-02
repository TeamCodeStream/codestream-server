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

	// perform the actual stream update 
	// the actual test is reading the stream and verifying it is correct
	updateStream (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/streams/${this.stream._id}`,
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				delete this.data;	// don't need this anymore
				if (response.stream.modifiedAt) {
					this.expectedStream.modifiedAt = response.stream.modifiedAt;
				}
				else if (response.stream.$set && response.stream.$set.modifiedAt) {
					this.expectedStream.modifiedAt = response.stream.$set.modifiedAt;
				}
				callback();
			}
		);
	}

	// validate that the response is correct
	validateResponse (data) {
		// verify what we fetch is what we got back in the response
		data.stream.memberIds.sort();
		this.expectedStream.memberIds.sort();
		Assert.deepEqual(data.stream, this.expectedStream, 'fetched stream does not match');
	}
}

module.exports = PutStreamFetchTest;
