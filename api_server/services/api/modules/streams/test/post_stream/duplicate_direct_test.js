'use strict';

var Post_Direct_Stream_Test = require('./post_direct_stream_test');
var Assert = require('assert');

class Duplicate_Direct_Test extends Post_Direct_Stream_Test {

	constructor (options) {
		super(options);
		this.test_options.want_duplicate_stream = true;
	}

	get description () {
		return 'should return the existing stream when creating a direct stream with matching members';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.member_ids = this.duplicate_stream.member_ids;
			callback();
		});
	}

	validate_response (data) {
		Assert(data.stream._id === this.duplicate_stream._id, 'returned stream should be the same as the existing stream');
		super.validate_response(data);
	}
}

module.exports = Duplicate_Direct_Test;
