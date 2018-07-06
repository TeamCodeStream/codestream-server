'use strict';

var PostCodeToFileStreamTest = require('./post_code_to_file_stream_test');
var Assert = require('assert');
const PostTestConstants = require('../post_test_constants');

class CodeBlockTest extends PostCodeToFileStreamTest {

	get description () {
		return 'should return the post with marker info when creating a post with code block info in a file stream';
	}

	// validate the response to the post request
	validateResponse (data) {
		// validate that we got a marker in the response that corresponds to the
		// code block we sent
		if (!this.dontExpectMarkers) {
			this.validateMarkers(data);
			this.validateMarkerLocations(data);
		}
		this.validateCodeBlocks(data);
		super.validateResponse(data);
	}

	// validate the markers created as a result of the post containing code blocks
	validateMarkers (data) {
		let post = data.post;
		Assert(data.markers instanceof Array, 'no markers array');
		Assert(data.markers.length === 1, 'length of markers array is ' + data.markers.length);
		let marker = data.markers[0];
		const markerStreamId = this.otherStream ? this.otherStream._id : post.streamId;
		Assert(marker.teamId === post.teamId, 'teamId does not match');
		Assert(marker.streamId === markerStreamId, 'streamId does not match');
		Assert(marker.postId === post._id, 'postId does not match');
		Assert(marker.postStreamId === this.stream._id, 'postStreamId of marker does not match the stream');
		Assert(marker.deactivated === false, 'deactivated is not false');
		Assert(marker.numComments === 1, 'marker should have 1 comment');
		Assert(marker.commitHashWhenCreated === this.data.commitHashWhenPosted.toLowerCase(), 'commitHashWhenCreated does not match');
		Assert(marker._id === post.codeBlocks[0].markerId, 'markerId in code block does not match marker created');
		this.validateSanitized(marker, PostTestConstants.UNSANITIZED_MARKER_ATTRIBUTES);
	}

	// validate the code blocks that came back in the response
	validateCodeBlocks (data) {
		let post = data.post;
		Assert(post.codeBlocks instanceof Array, 'no codeBlocks array');
		Assert(post.codeBlocks.length === 1, 'length of codeBlocks array is ' + post.codeBlocks.length);
		let codeBlock = post.codeBlocks[0];
		let expectedCodeBlock = Object.assign({}, post.codeBlocks[0]);
		delete expectedCodeBlock.streamId;
		Assert.deepEqual(codeBlock, expectedCodeBlock, 'returned code block does not match');
	}

	// validate that the marker locations structure matches expectations for a created code block
	validateMarkerLocations (data) {
		let post = data.post;
		let marker = data.markers[0];
		let markerLocations = data.markerLocations[0];
		Assert(typeof markerLocations === 'object', 'missing or invalid markerLocations object');
		Assert(markerLocations.teamId === post.teamId, 'markerLocations teamId does not match');
		const markerStreamId = this.otherStream ? this.otherStream._id : post.streamId;
		Assert(markerLocations.streamId === markerStreamId, 'markerLocations streamId does not match');
		Assert(markerLocations.commitHash === post.commitHashWhenPosted, 'markerLocations commitHash does not match commit hash for post');
		Assert(typeof markerLocations.locations === 'object', 'missing or invalid locations object in markerLocations object');
		let locations = markerLocations.locations;
		Assert.deepEqual(locations[marker._id], this.data.codeBlocks[0].location, 'location does not match');
	}
}

module.exports = CodeBlockTest;
