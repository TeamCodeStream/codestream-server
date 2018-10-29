'use strict';

const PostItemTest = require('./post_item_test');
const NormalizeURL = require(process.env.CS_API_TOP + '/modules/repos/normalize_url');
const Assert = require('assert');
const ItemTestConstants = require('../item_test_constants');
const Path = require('path');

class CodeBlockTest extends PostItemTest {

	get description () {
		return 'should return a valid item with marker data when creating an item tied to a third-party post, and including a code block';
	}

	getExpectedFields () {
		const expectedFields = super.getExpectedFields();
		expectedFields.item.push('markerIds');
		return expectedFields;
	}

	makeItemData (callback) {
		super.makeItemData(() => {
			this.postFactory.createRandomCodeBlocks(this.data, 1, { withRandomStream: true, randomCommitHash: true });
			callback();
		});
	}

	/* eslint complexity: 0 */
	// validate the response to the test request
	validateResponse (data) {
		this.validateMarkers(data);
		this.validateMarkerLocations(data);
		super.validateResponse(data);
	}

	// validate the markers created as a result of the post containing code blocks
	validateMarkers (data) {
		let errors = [];
		const item = data.item;
		const marker = data.markers[0];
		const codeBlock = this.data.codeBlocks[0];
		let result = (
			((marker.teamId === this.team._id) || errors.push('teamId does not match the team')) &&
			((marker.fileStreamId) || errors.push('no streamId for created marker')) &&
			((marker.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof marker.createdAt === 'number') || errors.push('createdAt not number')) &&
			((marker.modifiedAt >= marker.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((marker.creatorId === this.currentUser.user._id) || errors.push('creatorId not equal to current user id')) &&
			((marker.postStreamId === this.data.streamId) || errors.push('postStreamId does not match the item stream')) &&
			((marker.numComments === 1) || errors.push('marker should have 1 comment')) &&
			((marker.commitHashWhenCreated === codeBlock.commitHash.toLowerCase()) || errors.push('marker commit hash does not match the given commit hash')) &&
			((marker.file === codeBlock.file) || errors.push('marker file does not match the given file')) &&
			((marker.repo === NormalizeURL(codeBlock.remotes[0])) || errors.push('marker repo does not match the given remote')) &&
			((marker.repoId) || errors.push('no repoId for created marker')) &&
			((marker.code === codeBlock.code) || errors.push('marker code does not match the given code'))
		);
		Assert(result === true && errors.length === 0, 'returned marker not valid: ' + errors.join(', '));

		Assert.deepEqual(marker.locationWhenCreated, codeBlock.location, 'marker location does not match the given location');
		Assert.deepEqual(item.markerIds, [marker._id], 'item markerIds does not match the created marker');
		Assert.deepEqual(marker.itemIds, [item._id], 'marker g does not match the created item');

		// verify the marker has no attributes that should not go to clients
		this.validateSanitized(marker, ItemTestConstants.UNSANITIZED_MARKER_ATTRIBUTES);
	}

	// validate that the marker locations structure matches expectations for a created code block
	validateMarkerLocations (data) {
		let errors = [];
		const marker = data.markers[0];
		const markerLocations = data.markerLocations[0];
		let result = (
			((markerLocations.teamId === this.team._id) || errors.push('markerLocations teamId does not match')) &&
			((markerLocations.streamId === marker.fileStreamId) || errors.push('markerLocations streamId does not match marker fileStreaId')) &&
			((markerLocations.commitHash === marker.commitHashWhenCreated) || errors.push('markerLocations commitHash does not match the marker commitHash'))
		);
		Assert(result === true && errors.length === 0, 'returned markerLocations not valid: ' + errors.join(', '));
		const locations = markerLocations.locations;
		Assert.deepEqual(locations[marker._id], this.data.codeBlocks[0].location, 'markerLocations location for marker does not match');
	}

	// validate that the created stream matches expectations
	validateStream (data) {
		let errors = [];
		const stream = data.streams[0];
		const repo = data.repos[0];
		const marker = data.markers[0];
		let result = (
			((stream.teamId === this.team._id) || errors.push('stream teamId does not match')) &&
			((stream.repoId === repo._id) || errors.push('stream repoId does not match the created repo')) &&
			((stream.type === 'file') || errors.push('created stream is not type file')) &&
			((stream.file === this.data.codeBlocks[0].file) || errors.push('stream file does not match the given file')) &&
			((stream._id === marker.fileStreamId) || errors.push('marker fileStreamId does not match the created stream'))
		);
		Assert(result === true && errors.length === 0, 'returned stream not valid: ' + errors.join(', '));

		// verify the stream has no attributes that should not go to clients
		this.validateSanitized(stream, ItemTestConstants.UNSANITIZED_STREAM_ATTRIBUTES);
	}

	// validate that the created repo matches expectations
	validateRepo (data) {
		let errors = [];
		const repo = data.repos[0];
		const stream = data.streams[0];
		const marker = data.markers[0];
		const codeBlock = this.data.codeBlocks[0];
		let result = (
			((repo.teamId === this.team._id) || errors.push('repo teamId does not match')) &&
			((repo._id === marker.repoId) || errors.push('marker repoId does not match the created repo')) &&
			((stream.repoId === repo._id) || errors.push('stream repoId does not match the created repo'))
		);
		Assert(result === true && errors.length === 0, 'returned stream not valid: ' + errors.join(', '));

		// verify the remotes match up
		const repoRemotes = repo.remotes.map(remote => remote.normalizedUrl);
		repoRemotes.sort();
		const sentRemotes = codeBlock.remotes.map(remote => NormalizeURL(remote));
		sentRemotes.sort();
		Assert.deepEqual(repoRemotes, sentRemotes, 'remotes in the returned repo do not match the remotes sent with the request');
		const firstNormalizedRemote = NormalizeURL(this.codeBlock.remotes[0]);
		const parsedPath = Path.parse(firstNormalizedRemote);
		const expectedName = parsedPath.name;
		Assert.equal(repo.name, expectedName, 'repo name does not match the expected name');
	
		// verify the repo has no attributes that should not go to clients
		this.validateSanitized(repo, ItemTestConstants.UNSANITIZED_REPO_ATTRIBUTES);
	}
}

module.exports = CodeBlockTest;
