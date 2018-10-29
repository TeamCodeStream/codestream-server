'use strict';

const GetPostTest = require('./get_post_test');
const PostTestConstants = require('../post_test_constants');

class GetPostWithMarkerTest extends GetPostTest {

	constructor (options) {
		super(options);
		this.postOptions.wantCodeBlock = true;
	}

	get description () {
		return 'should return a valid post with a marker when requesting a post created with a code block';
	}

	// vdlidate the response to the request
	validateResponse (data) {
		const marker = data.post.markers[0];
		// verify we got the right post, and that there are no attributes we don't want the client to see
		this.validateMatchingObject(this.post.markerIds[0], marker, 'marker');
		this.validateSanitized(marker, PostTestConstants.UNSANITIZED_MARKER_ATTRIBUTES);
	}
}

module.exports = GetPostWithMarkerTest;
