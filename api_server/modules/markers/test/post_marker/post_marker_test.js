// base class for many tests of the "POST /posts" requests

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const MarkerTestConstants = require('../marker_test_constants');
const CommonInit = require('./common_init');

class PostMarkerTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return a valid marker when creating a marker tied to a third-party post';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/markers';
	}

	getExpectedFields () {
		return { marker: MarkerTestConstants.EXPECTED_MARKER_FIELDS };
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	/* eslint complexity: 0 */
	// validate the response to the test request
	validateResponse (data) {
		// verify we got back a marker with the attributes we specified
		const marker = data.marker;
		const codeBlock = marker.codeBlock;
		const markerLocations = data.markerLocations[0];
		const expectedMarkerStream = this.onTheFlyStream || this.repoStreams[0];
		const expectedRepo = this.onTheFlyRepo || this.repo;
		let errors = [];
		let result = (
			((marker.teamId === this.team._id) || errors.push('teamId does not match the team')) &&
			((marker.streamId === expectedMarkerStream._id) || errors.push('streamId does not match the file stream')) &&
			((marker.postId === this.data.postId) || errors.push('postId does not match the given post ID')) &&
			((marker.postStreamId === this.data.postStreamId) || errors.push('postStreamId does not match the given stream ID')) &&
			((marker.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof marker.createdAt === 'number') || errors.push('createdAt not number')) &&
			((marker.modifiedAt >= marker.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((marker.creatorId === this.currentUser.user._id) || errors.push('creatorId not equal to current user id')) &&
			((codeBlock.code === this.data.code) || errors.push('codeBlock code does not match the given code')) &&
			((codeBlock.streamId === expectedMarkerStream._id) || errors.push('codeBlock streamId does not match the stream')) &&
			((codeBlock.commitHash === this.data.commitHash.toLowerCase()) || errors.push('codeBlock commitHash does not match the given commit hash')) &&
			((codeBlock.repoId === expectedRepo._id) || errors.push('codeBlock repoId does not match the repo')) &&
			((codeBlock.file === expectedMarkerStream.file) || errors.push('codeBlock file does not match the given file')) &&
			((codeBlock.repo === expectedRepo.remotes[0].normalizedUrl) || errors.push('codeBlock repo does not match the URL of the repo')) &&
			((marker.commitHashWhenCreated === this.data.commitHash.toLowerCase()) || errors.push('commitHashWhenCreated not set to given commit hash')) &&
			((marker.numComments === 1) || errors.push('numComments not set to 1')) &&
			((markerLocations.teamId === this.team._id) || errors.push('markerLocations teamId does not match the team')) &&
			((markerLocations.streamId === expectedMarkerStream._id) || errors.push('markerLocations streamId does not match the file stream')) &&
			((markerLocations.commitHash === this.data.commitHash.toLowerCase()) || errors.push('markerLocations commitHash does not match the given commit hash'))
		);

		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		Assert.deepEqual(codeBlock.location, this.data.location, 'codeBlock location does not match the given location');
		Assert.deepEqual(markerLocations.locations[marker._id], this.data.location, 'markerLocations location for marker does not match the given location');

		// verify the marker in the response has no attributes that should not go to clients
		this.validateSanitized(marker, MarkerTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = PostMarkerTest;
