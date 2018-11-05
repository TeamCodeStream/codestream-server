'use strict';

const Assert = require('assert');
const NormalizeURL = require(process.env.CS_API_TOP + '/modules/repos/normalize_url');
const CodemarkTestConstants = require('../codemark_test_constants');
const Path = require('path');

class CodemarkValidator {

	constructor (options) {
		Object.assign(this, options);
	}

	/* eslint complexity: 0 */
	// validate the response to the test request
	validateCodemark (data) {
		// verify we got back an codemark with the attributes we specified
		const codemark = data.codemark;
		let errors = [];
		let result = (
			((codemark.teamId === this.test.team._id) || errors.push('teamId does not match the team')) &&
			((codemark.streamId === (this.inputCodemark.streamId || '')) || errors.push('streamId does not match the stream')) &&
			((codemark.postId === (this.inputCodemark.postId || '')) || errors.push('postId does not match the post')) &&
			((codemark.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof codemark.createdAt === 'number') || errors.push('createdAt not number')) &&
			((codemark.modifiedAt >= codemark.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((codemark.creatorId === this.test.currentUser.user._id) || errors.push('creatorId not equal to current user id')) &&
			((codemark.type === this.inputCodemark.type) || errors.push('type does not match')) &&
			((codemark.status === this.inputCodemark.status) || errors.push('status does not match')) &&
			((codemark.color === this.inputCodemark.color) || errors.push('color does not match')) &&
			((codemark.text === this.inputCodemark.text) || errors.push('text does not match')) &&
			((codemark.title === this.inputCodemark.title) || errors.push('title does not match')) &&
			((codemark.numReplies === 0) || errors.push('codemark should have 0 replies'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));

		// verify the codemark in the response has no attributes that should not go to clients
		this.test.validateSanitized(codemark, CodemarkTestConstants.UNSANITIZED_ATTRIBUTES);

		// if we are expecting a provider type, check it now
		if (this.test.expectProviderType) {
			Assert.equal(codemark.providerType, this.inputCodemark.providerType, 'providerType is not equal to the given providerType');
		}
		else {
			Assert.equal(typeof codemark.providerType, 'undefined', 'codemark providerType should be undefined');
		}

		// if we are expecting a marker with the codemark, validate it
		if (this.test.expectMarker) {
			this.validateMarker(data);
			this.validateMarkerLocations(data);
		}
		else {
			Assert(typeof data.markers === 'undefined', 'markers array should not be defined');
		}

		// if we created a file stream, validate it
		if (this.test.streamOnTheFly) {
			this.validateStream(data);
		}
		else {
			if (!this.test.streamUpdatesOk) {
				Assert(typeof data.streams === 'undefined', 'streams array should not be defined');
			}
			Assert(typeof data.repos === 'undefined', 'repos array should not be defined');
		}

		// if we created a repo, validate it
		if (this.test.repoOnTheFly) {
			this.validateRepo(data);
		}
	}

	// validate the markers created as a result of the codemark with markers
	validateMarker (data) {
		let errors = [];
		const codemark = data.codemark;
		Assert(data.markers instanceof Array, 'markers is not an array');
		Assert.equal(data.markers.length, 1, 'length of markers array should be 1');
		const marker = data.markers[0];
		const inputMarker = this.inputCodemark.markers[0];
		const repoUrl = this.getExpectedRepoUrl(inputMarker);
		const file = this.getExpectedFile(inputMarker);
		const repoId = this.getExpectedRepoId(data);
		const fileStreamId = this.getExpectedFileStreamId(data);
		const commitHash = this.getExpectedCommitHash(inputMarker);
		let result = (
			((marker.teamId === this.test.team._id) || errors.push('teamId does not match the team')) &&
			((marker.fileStreamId === fileStreamId) || errors.push('fileStreamId does not match the expected stream ID')) &&
			((marker.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof marker.createdAt === 'number') || errors.push('createdAt not number')) &&
			((marker.modifiedAt >= marker.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((marker.creatorId === this.test.currentUser.user._id) || errors.push('creatorId not equal to current user id')) &&
			((marker.postStreamId === codemark.streamId) || errors.push('postStreamId does not match the codemark stream')) &&
			((marker.postId === codemark.postId) || errors.push('postId does not match the codemark post')) &&
			((marker.codemarkId === codemark._id) || errors.push('codemarkId does not match the codemark')) && 
			((marker.commitHashWhenCreated === commitHash) || errors.push('marker commit hash does not match the expected commit hash')) &&
			((marker.file === file) || errors.push('marker file does not match the expected file')) &&
			((marker.repo === repoUrl) || errors.push('marker repo does not match the expected remote')) &&
			((marker.repoId === repoId) || errors.push('repoId does not match the expected repo ID')) &&
			((marker.code === inputMarker.code) || errors.push('marker code does not match the given code'))
		);
		Assert(result === true && errors.length === 0, 'returned marker not valid: ' + errors.join(', '));

		if (this.test.expectProviderType) {
			Assert.equal(marker.providerType, codemark.providerType, 'marker providerType not equal to codemark providerType');
		}
		else {
			Assert.equal(typeof marker.providerType, 'undefined', 'marker providerType should be undefined');
		}

		Assert.deepEqual(marker.locationWhenCreated, inputMarker.location, 'marker location does not match the given location');
		Assert.deepEqual(codemark.markerIds, [marker._id], 'codemark markerIds does not match the created marker');
		Assert.deepEqual(codemark.fileStreamIds, [marker.fileStreamId || null], 'codemark fileStreamIds does not match the file streams of the created markers');

		// verify the marker has no attributes that should not go to clients
		this.test.validateSanitized(marker, CodemarkTestConstants.UNSANITIZED_MARKER_ATTRIBUTES);
	}

	// get the URL of the repo we expect to see in the marker
	getExpectedRepoUrl (inputMarker) {
		if (this.test.repoOnTheFly) {
			return NormalizeURL(inputMarker.remotes[0]);
		}
		else if (!this.test.dontExpectRepo && this.test.repo) {
			return this.test.repo.remotes[0].normalizedUrl;
		}
		else {
			return undefined;
		}
	}

	// get the file we expect to see in the marker
	getExpectedFile (inputMarker) {
		if (this.test.streamOnTheFly) {
			return inputMarker.file;
		}
		else if (this.test.expectedFile) {
			return this.test.expectedFile;
		}
		else if (!this.test.dontExpectFile && this.test.repoStreams && this.test.repoStreams[0]) {
			return this.test.repoStreams[0].file;
		}
		else {
			return undefined;
		}
	}

	// get the repo ID we expect to see in the marker
	getExpectedRepoId (data) {
		if (this.test.repoOnTheFly) {
			return data.repos[0]._id;
		}
		else if (!this.test.dontExpectRepoId && this.test.repo) {
			return this.test.repo._id;
		}
		else {
			return undefined;
		}
	}

	// get the file stream ID we expect to see in the marker
	getExpectedFileStreamId (data) {
		if (this.test.streamOnTheFly) {
			return data.streams[0]._id;
		}
		else if (!this.test.dontExpectFileStreamId && this.test.repoStreams && this.test.repoStreams[0]) {
			return this.test.repoStreams[0]._id;
		}
		else {
			return undefined;
		}
	}

	// get the commit hash we expect to see in the marker
	getExpectedCommitHash (inputMarker) {
		if (!this.test.dontExpectCommitHash && inputMarker.commitHash) {
			return inputMarker.commitHash.toLowerCase();
		}
		else {
			return undefined;
		}
	}

	// validate that the marker locations structure matches expectations for a created marker
	validateMarkerLocations (data) {
		const inputMarker = this.inputCodemark.markers[0];
		if (this.test.dontExpectMarkerLocations || !inputMarker.commitHash || !inputMarker.location) { 
			Assert.equal(typeof data.markerLocations, 'undefined', 'markerLocations should be undefined');
			return;
		}
		let errors = [];
		const marker = data.markers[0];
		const markerLocations = data.markerLocations[0];
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
		const repo = this.test.repoOnTheFly ? data.repos[0] : this.test.repo;
		const marker = data.markers[0];
		const inputMarker = this.inputCodemark.markers[0];
		const file = this.test.streamOnTheFly ? inputMarker.file : this.test.repoStreams[0].file;
		let result = (
			((stream.teamId === this.test.team._id) || errors.push('stream teamId does not match')) &&
			((stream.repoId === repo._id) || errors.push('stream repoId does not match the created repo')) &&
			((stream.type === 'file') || errors.push('created stream is not type file')) &&
			((stream.file === file) || errors.push('stream file does not match the given file')) &&
			((stream._id === marker.fileStreamId) || errors.push('marker fileStreamId does not match the created stream'))
		);
		Assert(result === true && errors.length === 0, 'returned stream not valid: ' + errors.join(', '));

		// verify the stream has no attributes that should not go to clients
		this.test.validateSanitized(stream, CodemarkTestConstants.UNSANITIZED_STREAM_ATTRIBUTES);
	}

	// validate that the created repo matches expectations
	validateRepo (data) {
		let errors = [];
		const repo = data.repos[0];
		const stream = this.test.streamOnTheFly ? data.streams[0] : this.repoStreams[0];
		const marker = data.markers[0];
		const inputMarker = this.inputCodemark.markers[0];
		let result = (
			((repo.teamId === this.test.team._id) || errors.push('repo teamId does not match')) &&
			((repo._id === marker.repoId) || errors.push('marker repoId does not match the created repo')) &&
			((stream.repoId === repo._id) || errors.push('stream repoId does not match the created repo'))
		);
		Assert(result === true && errors.length === 0, 'returned repo not valid: ' + errors.join(', '));

		// verify the remotes match up
		if (inputMarker.remotes) {
			const repoRemotes = repo.remotes.map(remote => remote.normalizedUrl);
			repoRemotes.sort();
			const sentRemotes = inputMarker.remotes.map(remote => NormalizeURL(remote));
			sentRemotes.sort();
			Assert.deepEqual(repoRemotes, sentRemotes, 'remotes in returned repo do not match remotes sent with marker');
			const parsedPath = Path.parse(NormalizeURL(inputMarker.remotes[0]));
			const expectedName = parsedPath.name;
			Assert.equal(repo.name, expectedName, 'repo name does not match the expected name');
		}

		// verify the repo has no attributes that should not go to clients
		this.test.validateSanitized(repo, CodemarkTestConstants.UNSANITIZED_REPO_ATTRIBUTES);
	}
}

module.exports = CodemarkValidator;
