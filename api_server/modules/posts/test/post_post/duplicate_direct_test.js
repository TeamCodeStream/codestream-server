'use strict';

var DirectOnTheFlyTest = require('./direct_on_the_fly_test');
var Assert = require('assert');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class DuplicateDirectTest extends DirectOnTheFlyTest {

	get description () {
		return 'should find and use the existing stream when creating a post and creating a direct stream on the fly with matching members';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createDuplicateStream	// pre-create a channel stream with the same membership as we'll use in the test
		], callback);
	}

	// create a direct stream which will look like a duplicate when we run the test
	createDuplicateStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.duplicateStream = response.stream;
				callback();
			},
			// use the members of the pre-created direct stream when we try to run the test
			Object.assign({}, this.streamOptions, {
				memberIds: this.data.stream.memberIds,
				token: this.token
			})
		);
	}

	// validate the response to the post request
	validateResponse (data) {
		// validate that we get back the stream that was already created, instead of a new stream
		Assert(data.stream._id === this.duplicateStream._id, 'returned stream should be the same as the existing stream');
		super.validateResponse(data);
	}
}

module.exports = DuplicateDirectTest;
