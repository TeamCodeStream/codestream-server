'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class ReviewNumMarkersTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		//this.streamOptions.creatorIndex = 1;
		this.repoOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			creatorIndex: 0,
			numPosts: 3,
			wantReview: true,
			wantMarkers: 1,
			numChanges: 2
		});
	}

	get description () {
		// each time a post with markers is created in a stream, we increment an attribute
		// of the stream called numMarkers ... this is important for the client to know when
		// it has all the marker locations for a given stream
		return 'numMarkers for the stream should get incremented when a post and review is created in the stream with markers';
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
			this.path = '/streams/' + this.teamStream.id;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify that numMarkers is equal to the total number of posts
		Assert.strictEqual(data.stream.numMarkers, this.postOptions.numPosts + 1, 'numMarkers not incremented correctly');
	}
}

module.exports = ReviewNumMarkersTest;
