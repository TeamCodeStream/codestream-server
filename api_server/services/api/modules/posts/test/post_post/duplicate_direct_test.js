'use strict';

var DirectOnTheFlyTest = require('./direct_on_the_fly_test');
var Assert = require('assert');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class DuplicateDirectTest extends DirectOnTheFlyTest {

	get description () {
		return 'should find and use the existing stream when creating a post and creating a direct stream on the fly with matching members';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createDuplicateStream
		], callback);
	}

	createDuplicateStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.duplicateStream = response.stream;
				callback();
			},
			Object.assign({}, this.streamOptions, {
				memberIds: this.data.stream.memberIds,
				token: this.token
			})
		);
	}

	validateResponse (data) {
		Assert(data.stream._id === this.duplicateStream._id, 'returned stream should be the same as the existing stream');
		super.validateResponse(data);
	}
}

module.exports = DuplicateDirectTest;
