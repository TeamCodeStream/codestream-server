'use strict';

var PostDirectStreamTest = require('./post_direct_stream_test');
var Assert = require('assert');

class DuplicateDirectTest extends PostDirectStreamTest {

	constructor (options) {
		super(options);
		this.testOptions.wantDuplicateStream = true;
	}

	get description () {
		return 'should return the existing stream when creating a direct stream with matching members';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.memberIds = this.duplicateStream.memberIds;
			callback();
		});
	}

	validateResponse (data) {
		Assert(data.stream._id === this.duplicateStream._id, 'returned stream should be the same as the existing stream');
		super.validateResponse(data);
	}
}

module.exports = DuplicateDirectTest;
