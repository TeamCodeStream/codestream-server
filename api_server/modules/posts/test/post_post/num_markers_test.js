'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class NumMarkersTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.streamOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			creatorIndex: 0,
			numPosts: 3,
			wantMarker: true
		});
	}

	get description () {
		// each time a post with markers is created in a stream, we increment an attribute
		// of the stream called numMarkers ... this is important for the client to know when
		// it has all the marker locations for a given stream
		return 'numMarkers for the stream should get incremented when a post is created in the stream with markers';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { stream: ['numMarkers'] };
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/streams/' + this.stream._id;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify that numMarkers is equal to the total number of posts
		Assert.equal(data.stream.numMarkers, this.postOptions.numPosts, 'numMarkers not incremented correctly');
	}
}

module.exports = NumMarkersTest;
