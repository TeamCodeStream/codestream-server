'use strict';

const GetPostsTest = require('./get_posts_test');
const PostTestConstants = require('../post_test_constants');
const Assert = require('assert');

class GetMarkersWithPostsTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.postOptions.wantCodeBlock = 1;
		this.postOptions.commitHash = this.postFactory.randomCommitHash();
	}

	get description () {
		return 'should return markers and marker locations when requesting posts in a file stream that have code blocks';
	}

	// set the path to use for the request
	setPath (callback) {
		super.setPath(() => {
			this.path += `&withMarkers&commitHash=${this.postOptions.commitHash}`;
			this.expectedMarkers = this.postData.map(postData => postData.markers[0]);
			this.expectedMarkerLocations = this.postData[0].markerLocations[0];
			this.postData.forEach(postData => {
				Object.assign(this.expectedMarkerLocations.locations, postData.markerLocations[0].locations);
			});
			callback();
		});
	}

	createStreamAndPosts (callback) {
		this.postOptions.codeBlockStreamId = this.repoStreams[0]._id;
		super.createStreamAndPosts(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// check that we got the expected markers and marker locations
		this.validateMatchingObjects(data.markers, this.expectedMarkers, 'markers');
		this.validateSanitizedObjects(data.markers, PostTestConstants.UNSANITIZED_MARKER_ATTRIBUTES);
		Assert.deepEqual(this.expectedMarkerLocations, data.markerLocations, 'markerLocations does not match');
		super.validateResponse(data);
	}
}

module.exports = GetMarkersWithPostsTest;
