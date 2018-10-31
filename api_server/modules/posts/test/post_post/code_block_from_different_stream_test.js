'use strict';

const PostPostTest = require('./post_post_test');
const Assert = require('assert');

class MarkerFromDifferentStreamTest extends PostPostTest {

	get description () {
		return `should return a valid post when creating a post in a ${this.streamType} stream referencing a marker from another stream`;
	}

	setTestOptions (callback) {
		this.wantMarker = true;
		super.setTestOptions(() => {
			this.streamOptions.type = this.streamType;
			this.repoOptions.creatorIndex = 1;
			callback();
		});
	}

	// form the data we'll use in creating the post
	makePostData (callback) {
		super.makePostData(() => {
			this.data.markers[0].streamId = this.repoStreams[0]._id;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that the marker for the marker points to the other stream,
		// but that the post points to the original stream created for the test
		const post = data.post;
		if (!this.dontExpectMarkers) {
			const marker = data.markers[0];
			Assert(marker.streamId === this.repoStreams[0]._id, 'streamId of marker does not match the file stream ID');
			Assert(post.streamId !== marker.streamId, 'the streamId of the post and the streamId of the marker are the same');
			Assert(post.markers[0].file === this.repoStreams[0].file, 'file of returned marker does not match other stream');
		}
		super.validateResponse(data);
	}
}

module.exports = MarkerFromDifferentStreamTest;
