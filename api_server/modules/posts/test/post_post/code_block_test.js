'use strict';

const PostPostTest = require('./post_post_test');
const Assert = require('assert');
const PostTestConstants = require('../post_test_constants');

class CodeBlockTest extends PostPostTest {

	get description () {
		return 'should return the post with marker info when creating a post with code block info in a file stream';
	}

	setTestOptions (callback) {
		this.wantCodeBlock = true;
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			this.streamOptions.type = this.streamType || 'file';
			callback();
		});
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
		const commitHash = this.data.commitHashWhenPosted || this.data.codeBlocks[0].commitHash;
		const post = data.post;
		Assert(data.markers instanceof Array, 'no markers array');
		Assert(data.markers.length === 1, 'length of markers array is ' + data.markers.length);
		const marker = data.markers[0];
		const markerStreamId = this.otherStream ? this.otherStream._id : post.streamId;
		Assert(marker.teamId === post.teamId, 'teamId does not match');
		Assert(marker.streamId === markerStreamId, 'streamId does not match');
		Assert(marker.postId === post._id, 'postId does not match');
		Assert(marker.postStreamId === this.stream._id, 'postStreamId of marker does not match the stream');
		Assert(marker.deactivated === false, 'deactivated is not false');
		Assert(marker.numComments === 1, 'marker should have 1 comment');
		Assert(marker.commitHashWhenCreated === commitHash.toLowerCase(), 'commitHashWhenCreated does not match');
		Assert(marker._id === post.codeBlocks[0].markerId, 'markerId in code block does not match marker created');
		const expectedCodeBlock = Object.assign({}, post.codeBlocks[0]);
		delete expectedCodeBlock.markerId;
		if (this.data.codeBlocks[0].location) {
			expectedCodeBlock.location = this.data.codeBlocks[0].location;
		}
		Assert.deepEqual(marker.codeBlock, expectedCodeBlock, 'code block of marker not equal to code block of post');
		Assert.deepEqual(post.markerIds, [ marker._id ], 'marker ID not found in post markerIds');
		this.validateSanitized(marker, PostTestConstants.UNSANITIZED_MARKER_ATTRIBUTES);
	}

	// validate the code blocks that came back in the response
	validateCodeBlocks (data) {
		const post = data.post;
		const commitHash = this.data.commitHashWhenPosted || this.data.codeBlocks[0].commitHash;
		Assert(post.codeBlocks instanceof Array, 'no codeBlocks array');
		Assert(post.codeBlocks.length === 1, 'length of codeBlocks array is ' + post.codeBlocks.length);
		const codeBlock = post.codeBlocks[0];
		if (!this.dontExpectMarkers) {
			const marker = data.markers[0];
			Assert(codeBlock.markerId === marker._id, 'codeBlock markerId not equal to marker ID');
		}
		const codeBlockStream = this.otherStream || this.stream;
		if (!this.dontExpectStreams) {
			Assert(codeBlock.streamId === codeBlockStream._id, 'codeBlock streamId not equal to proper stream ID');
		}
		const codeBlockFile = this.dontExpectStreams ? this.data.codeBlocks[0].file : codeBlockStream.file;
		Assert(codeBlock.file === codeBlockFile, 'codeBlock file not equal to proper file for stream');
		const codeBlockRepo = this.createdRepo || this.repo;
		if (!this.dontExpectStreams) {
			Assert(codeBlock.repoId === codeBlockRepo._id, 'codeBlock repoId not equal to ID of expected repo');
			const codeBlockUrl = codeBlockRepo.remotes[0].normalizedUrl;
			Assert(codeBlock.repo === codeBlockUrl, 'codeBlock repo not equal to the expected repo url');
		}
		Assert(codeBlock.commitHash === commitHash.toLowerCase(), 'codeBlock commitHash not equal to commitHash of post');
		const inputCodeBlock = this.data.codeBlocks[0];
		Assert(codeBlock.code === inputCodeBlock.code, 'code not correct');
		Assert(codeBlock.preContext === inputCodeBlock.preContext, 'code not correct');
		Assert(codeBlock.postContext === inputCodeBlock.postContext, 'code not correct');
	}

	// validate that the marker locations structure matches expectations for a created code block
	validateMarkerLocations (data) {
		if (!this.data.codeBlocks[0].location) { return; }
		const post = data.post;
		const marker = data.markers[0];
		const markerLocations = data.markerLocations[0];
		const commitHash = this.data.commitHashWhenPosted || this.data.codeBlocks[0].commitHash;
		Assert(typeof markerLocations === 'object', 'mssing or invalid markerLocations object');
		Assert(markerLocations.teamId === post.teamId, 'markerLocations teamId does not match');
		const markerStreamId = this.otherStream ? this.otherStream._id : post.streamId;
		Assert(markerLocations.streamId === markerStreamId, 'markerLocations streamId does not match');
		Assert(markerLocations.commitHash === commitHash.toLowerCase(), 'markerLocations commitHash does not match commit hash for post');
		Assert(typeof markerLocations.locations === 'object', 'missing or invalid locations object in markerLocations object');
		const locations = markerLocations.locations;
		Assert.deepEqual(locations[marker._id], this.data.codeBlocks[0].location, 'location does not match');
	}
}

module.exports = CodeBlockTest;
