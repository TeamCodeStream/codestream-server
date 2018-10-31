'use strict';

const Assert = require('assert');
const NormalizeURL = require(process.env.CS_API_TOP + '/modules/repos/normalize_url');
const ItemTestConstants = require('../item_test_constants');
const Path = require('path');

class ItemValidator {

	constructor (options) {
		Object.assign(this, options);
	}

	/* eslint complexity: 0 */
	// validate the response to the test request
	validateItem (data) {
		// verify we got back an item with the attributes we specified
		const item = data.item;
		let errors = [];
		let result = (
			((item.teamId === this.test.team._id) || errors.push('teamId does not match the team')) &&
			((item.streamId === this.inputItem.streamId) || errors.push('streamId does not match the stream')) &&
			((item.postId === this.inputItem.postId) || errors.push('postId does not match the post')) &&
			((item.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof item.createdAt === 'number') || errors.push('createdAt not number')) &&
			((item.modifiedAt >= item.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((item.creatorId === this.test.currentUser.user._id) || errors.push('creatorId not equal to current user id')) &&
			((item.type === this.inputItem.type) || errors.push('type does not match')) &&
			((item.status === this.inputItem.status) || errors.push('status does not match')) &&
			((item.color === this.inputItem.color) || errors.push('color does not match')) &&
			((item.text === this.inputItem.text) || errors.push('text does not match')) &&
			((item.title === this.inputItem.title) || errors.push('title does not match'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));

		// verify the item in the response has no attributes that should not go to clients
		this.test.validateSanitized(item, ItemTestConstants.UNSANITIZED_ATTRIBUTES);

		// if we are expecting a provider type, check it now
		if (this.test.expectProviderType) {
			Assert.equal(item.providerType, this.inputItem.providerType, 'providerType is not equal to the given providerType');
		}
		else {
			Assert.equal(typeof item.providerType, 'undefined', 'item providerType should be undefined');
		}

		// if we are expecting a marker with the item, validate it
		if (this.test.expectMarker) {
			this.validateMarker(data);
			this.validateMarkerLocations(data);
		}
		else {
			Assert(typeof data.markers === 'undefined', 'markers array should not be defined');
		}

		// if we created a file stream, validate it
		if (this.test.expectStream) {
			this.validateStream(data);
			this.validateRepo(data);
		}
		else {
			if (!this.test.streamUpdatesOk) {
				Assert(typeof data.streams === 'undefined', 'streams array should not be defined');
			}
			Assert(typeof data.repos === 'undefined', 'repos array should not be defined');
		}
	}

	// validate the markers created as a result of the item with markers
	validateMarker (data) {
		let errors = [];
		const item = data.item;
		Assert(data.markers instanceof Array, 'markers is not an array');
		Assert.equal(data.markers.length, 1, 'length of markers array should be 1');
		const marker = data.markers[0];
		const inputMarker = this.inputItem.markers[0];
		const repoUrl = this.test.repo ? 
			this.test.repo.remotes[0].normalizedUrl :
			NormalizeURL(inputMarker.remotes[0]);
		const file = this.test.repoStreams ? this.test.repoStreams[0].file : inputMarker.file;
		let result = (
			((marker.teamId === this.test.team._id) || errors.push('teamId does not match the team')) &&
			((marker.fileStreamId) || errors.push('no streamId for created marker')) &&
			((marker.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof marker.createdAt === 'number') || errors.push('createdAt not number')) &&
			((marker.modifiedAt >= marker.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((marker.creatorId === this.test.currentUser.user._id) || errors.push('creatorId not equal to current user id')) &&
			((marker.postStreamId === item.streamId) || errors.push('postStreamId does not match the item stream')) &&
			((marker.postId === item.postId) || errors.push('postId does not match the item post')) &&
			((marker.itemId === item._id) || errors.push('itemId does not match the item')) && 
			((marker.numComments === 1) || errors.push('marker should have 1 comment')) &&
			((marker.commitHashWhenCreated === inputMarker.commitHash.toLowerCase()) || errors.push('marker commit hash does not match the given commit hash')) &&
			((marker.file === file) || errors.push('marker file does not match the given file')) &&
			((marker.repo === repoUrl) || errors.push('marker repo does not match the given remote')) &&
			((marker.repoId) || errors.push('no repoId for created marker')) &&
			((marker.code === inputMarker.code) || errors.push('marker code does not match the given code'))
		);
		Assert(result === true && errors.length === 0, 'returned marker not valid: ' + errors.join(', '));

		if (this.test.expectProviderType) {
			Assert.equal(marker.providerType, item.providerType, 'marker providerType not equal to item providerType');
		}
		else {
			Assert.equal(typeof marker.providerType, 'undefined', 'marker providerType should be undefined');
		}

		Assert.deepEqual(marker.locationWhenCreated, inputMarker.location, 'marker location does not match the given location');
		Assert.deepEqual(item.markerIds, [marker._id], 'item markerIds does not match the created marker');
		Assert.deepEqual(item.fileStreamIds, [marker.fileStreamId], 'item fileStreamIds does not match the file streams of the created markers');

		// verify the marker has no attributes that should not go to clients
		this.test.validateSanitized(marker, ItemTestConstants.UNSANITIZED_MARKER_ATTRIBUTES);
	}

	// validate that the marker locations structure matches expectations for a created marker
	validateMarkerLocations (data) {
		let errors = [];
		const marker = data.markers[0];
		const markerLocations = data.markerLocations[0];
		const inputMarker = this.inputItem.markers[0];
		Assert.equal(typeof markerLocations, 'object', 'markerLocations is not an object');
		let result = (
			((markerLocations.teamId === this.test.team._id) || errors.push('markerLocations teamId does not match')) &&
			((markerLocations.streamId === marker.fileStreamId) || errors.push('markerLocations streamId does not match marker fileStreaId')) &&
			((markerLocations.commitHash === marker.commitHashWhenCreated) || errors.push('markerLocations commitHash does not match the marker commitHash'))
		);
		Assert(result === true && errors.length === 0, 'returned markerLocations not valid: ' + errors.join(', '));
		const locations = markerLocations.locations;
		Assert.deepEqual(locations[marker._id], inputMarker.location, 'markerLocations location for marker does not match');
	}

	// validate that the created stream matches expectations
	validateStream (data) {
		let errors = [];
		const stream = data.streams.find(stream => stream.createdAt);
		const repo = this.test.repo || data.repos[0];
		const marker = data.markers[0];
		const inputMarker = this.inputItem.markers[0];
		const file = this.test.repoStreams ? this.test.repoStreams[0].file : inputMarker.file;
		let result = (
			((stream.teamId === this.test.team._id) || errors.push('stream teamId does not match')) &&
			((stream.repoId === repo._id) || errors.push('stream repoId does not match the created repo')) &&
			((stream.type === 'file') || errors.push('created stream is not type file')) &&
			((stream.file === file) || errors.push('stream file does not match the given file')) &&
			((stream._id === marker.fileStreamId) || errors.push('marker fileStreamId does not match the created stream'))
		);
		Assert(result === true && errors.length === 0, 'returned stream not valid: ' + errors.join(', '));

		// verify the stream has no attributes that should not go to clients
		this.test.validateSanitized(stream, ItemTestConstants.UNSANITIZED_STREAM_ATTRIBUTES);
	}

	// validate that the created repo matches expectations
	validateRepo (data) {
		let errors = [];
		const repo = this.test.repo || data.repos[0];
		const stream = data.streams[0];
		const marker = data.markers[0];
		const inputMarker = this.inputItem.markers[0];
		let result = (
			((repo.teamId === this.test.team._id) || errors.push('repo teamId does not match')) &&
			((repo._id === marker.repoId) || errors.push('marker repoId does not match the created repo')) &&
			((stream.repoId === repo._id) || errors.push('stream repoId does not match the created repo'))
		);
		Assert(result === true && errors.length === 0, 'returned stream not valid: ' + errors.join(', '));

		// verify the remotes match up
		if (inputMarker.remotes) {
			const repoRemotes = repo.remotes.map(remote => remote.normalizedUrl);
			repoRemotes.sort();
			const sentRemotes = inputMarker.remotes.map(remote => NormalizeURL(remote));
			sentRemotes.sort();
			Assert.deepEqual(repoRemotes, sentRemotes, 'remotes in the returned repo do not match the remotes sent with the request');
			const firstNormalizedRemote = NormalizeURL(inputMarker.remotes[0]);
			const parsedPath = Path.parse(firstNormalizedRemote);
			const expectedName = parsedPath.name;
			Assert.equal(repo.name, expectedName, 'repo name does not match the expected name');
		}

		// verify the repo has no attributes that should not go to clients
		this.test.validateSanitized(repo, ItemTestConstants.UNSANITIZED_REPO_ATTRIBUTES);
	}
}

module.exports = ItemValidator;
