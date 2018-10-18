'use strict';

const PostDirectStreamTest = require('./post_direct_stream_test');
const Assert = require('assert');

class DuplicateDirectTest extends PostDirectStreamTest {

	constructor (options) {
		super(options);
		this.wantDuplicateStream = true;	// indicates to create a duplicate stream before the actual test runs
	}

	get description () {
		return 'should return the existing stream when creating a direct stream with matching members';
	}

	// before the test runs...
	before (callback) {
		// run the standard test setup for creating a direct stream...
		super.before(error => {
			if (error) { return callback(error); }
			// ...and give our test stream the same members, this should cause the server
			// to find the existing direct stream, and return that in the response
			this.data.memberIds = this.duplicateStream.memberIds;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got back the stream that we already created
		Assert(data.stream._id === this.duplicateStream._id, 'returned stream should be the same as the existing stream');
		super.validateResponse(data);
	}
}

module.exports = DuplicateDirectTest;
