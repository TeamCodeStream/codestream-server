// base class for many tests of the "PUT /join/:id" requests

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const StreamTestConstants = require('../stream_test_constants');

class JoinTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the updated stream when joining a public channel stream';
	}

	getExpectedFields () {
		return { 
			stream: {
				$set: ['modifiedAt'],
				$addToSet: ['memberIds']
			} 
		};
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got a directive in the update to add the user
		const stream = data.stream;
		Assert(stream._id === this.stream._id, 'returned stream ID is not the same');
		const set = stream.$set;
		Assert(set.modifiedAt > this.modifiedAfter, 'modifiedAt is not greater than before the stream was updated');
		Assert.deepEqual(stream.$addToSet.memberIds, [this.currentUser._id], 'added membership array not equal to the current user');
		// verify the post in the response has no attributes that should not go to clients
		this.validateSanitized(set, StreamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = JoinTest;
