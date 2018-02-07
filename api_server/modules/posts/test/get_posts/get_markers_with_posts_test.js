'use strict';

var GetPostsTest = require('./get_posts_test');
const PostTestConstants = require('../post_test_constants');
const Assert = require('assert');

class GetMarkersWithPostsTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.type = 'file';
		this.wantCodeBlocks = 1;
		this.commitHash = this.postFactory.randomCommitHash();
	}

	get description () {
		return 'should return markers and marker locations when requesting posts in a file stream that have code blocks';
	}

	// set options for creating the posts we will fetch
	setPostOptions (n) {
		let postOptions = super.setPostOptions(n);
		postOptions.commitHash = this.commitHash;
		return postOptions;
	}

	// set the path to use for the request
	setPath (callback) {
		super.setPath(() => {
			this.path += `&withMarkers&commitHash=${this.commitHash}`;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// check that we got the expected markers and marker locations
		this.validateMatchingObjects(data.markers, this.myMarkers, 'posts');
		this.validateSanitizedObjects(data.markers, PostTestConstants.UNSANITIZED_MARKER_ATTRIBUTES);
		Assert.deepEqual(this.myMarkerLocations, data.markerLocations, 'markerLocations does not match');
		super.validateResponse(data);
	}
}

module.exports = GetMarkersWithPostsTest;
