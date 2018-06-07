// base class for many tests of the "PUT /streams" requests

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const StreamTestConstants = require('../stream_test_constants');

class PutStreamTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the updated stream when updating a stream';
	}

	getExpectedFields () {
		return { 
			stream: ['name', 'purpose', 'modifiedAt']
		};
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data, useSet = false) {
		// verify we got back a stream with the update
		let stream = data.stream;
		Assert(stream._id === this.stream._id, 'returned stream ID is not the same');
		if (useSet) {
			stream = stream.$set;
		}
		Assert.equal(stream.name, this.data.name, 'name does not match');
		Assert.equal(stream.purpose, this.data.purpose, 'purpose does not match');
		Assert(stream.modifiedAt > this.modifiedAfter, 'modifiedAt is not greater than before the stream was updated');
		// verify the post in the response has no attributes that should not go to clients
		this.validateSanitized(stream, StreamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = PutStreamTest;
