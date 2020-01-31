'use strict';

const Assert = require('assert');
const NormalizeURL = require(process.env.CS_API_TOP + '/modules/repos/normalize_url');
const ExtractCompanyIdentifier = require(process.env.CS_API_TOP + '/modules/repos/extract_company_identifier');
const Path = require('path');
const ApiConfig = require(process.env.CS_API_TOP + '/config/api');
const MarkerTestConstants = require('./marker_test_constants');
const StreamTestConstants = require(process.env.CS_API_TOP + '/modules/streams/test/stream_test_constants');
const RepoTestConstants = require(process.env.CS_API_TOP + '/modules/repos/test/repo_test_constants');

class MarkerValidator {

	constructor (options) {
		Object.assign(this, options);
	}

	/* eslint complexity: 0 */
	// validate markers created in association with a codemark or a code review
	validateMarkers (data) {
		const outputObject = data[this.objectName];
		const inputMarker = this.inputObject.markers && this.inputObject.markers[0];
		this.validateEachMarker(data);
		this.validateMarkerLocations(data);

		// if we created a file stream, validate it
		if (this.test.streamOnTheFly) {
			this.validateStream(data);
		}
		else if (!this.test.streamUpdatesOk) {
			Assert(typeof data.streams === 'undefined', 'streams array should not be defined');
		}

		// if we created a repo, validate it
		if (this.test.repoOnTheFly) {
			this.validateRepo(data);
		}
		else if (inputMarker && (inputMarker.repoId || inputMarker.fileStreamId || (inputMarker.commitHash && inputMarker.remotes))) {
			this.validateRepoUpdatedWithCommitHash(data);
		}
		else {
			Assert(data.repos === undefined, 'repos should be undefined');
		}

		// validate the array of followers
		const expectedFollowerIds = this.test.expectedFollowerIds || [this.test.currentUser.user.id];
		expectedFollowerIds.sort();
		const gotFollowerIds = [...(outputObject.followerIds || [])];
		gotFollowerIds.sort();
		Assert.deepEqual(gotFollowerIds, expectedFollowerIds, 'codemark does not have correct followerIds');
	}

	// validate the markers created as a result of the codemark or review with markers
	validateEachMarker (data) {
		Assert(data.markers instanceof Array, 'markers is not an array');
		Assert.equal(data.markers.length, this.test.expectMarkers, 'length of markers array should be ' + this.test.expectMarkers);
		for (let i = 0; i < this.test.expectMarkers; i++) {
			this.validateMarker(data, i);
		}
	}

	// validate the nth marker created as a result of the codemark or review with markers
	validateMarker (data, n) {
		let errors = [];
		const outputObject = data[this.objectName];
		const marker = data.markers[n];
		const inputMarker = this.inputObject.markers[n];
		const repoUrl = this.getExpectedRepoUrl(inputMarker);
		const file = this.getExpectedFile(inputMarker);
		const repoId = this.getExpectedRepoId(data, n);
		const fileStreamId = this.getExpectedFileStreamId(data, n);
		const commitHash = this.getExpectedCommitHash(inputMarker);
		let result = (
			((marker.id === marker._id) || errors.push('id not set to _id')) && 	// DEPRECATE ME
			((marker.teamId === this.test.team.id) || errors.push('teamId does not match the team')) &&
			((marker.fileStreamId === fileStreamId) || errors.push('fileStreamId does not match the expected stream ID')) &&
			((marker.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof marker.createdAt === 'number') || errors.push('createdAt not number')) &&
			((marker.modifiedAt >= marker.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((marker.creatorId === this.test.currentUser.user.id) || errors.push('creatorId not equal to current user id')) &&
			((marker[`${this.objectName}Id`] === outputObject.id) || errors.push(`${this.objectName}Id does not match the ${this.objectName}`)) && 
			((marker.commitHashWhenCreated === commitHash) || errors.push('marker commit hash does not match the expected commit hash')) &&
			((marker.file === file) || errors.push('marker file does not match the expected file')) &&
			((marker.repo === repoUrl) || errors.push('marker repo does not match the expected remote')) &&
			((marker.repoId === repoId) || errors.push('repoId does not match the expected repo ID')) &&
			((marker.code === inputMarker.code) || errors.push('marker code does not match the given code'))
		);
		if (this.inputObject.providerType || this.usingCodeStreamChannels) {
			result = result && (
				((marker.postStreamId === outputObject.streamId) || errors.push(`postStreamId does not match the ${this.objectName} stream`)) &&
				((marker.postId === outputObject.postId) || errors.push(`postId does not match the ${this.objectName} post`))
			);
		}
		else {
			result = result && (
				((typeof marker.postStreamId === 'undefined') || errors.push('marker streamId is not undefined')) &&
				((typeof marker.postId === 'undefined') || errors.push('marker postId is not undefined'))
			);
		}
		Assert(result === true && errors.length === 0, `returned marker ${n} not valid: ${errors.join(', ')}`);

		if (this.test.expectProviderType) {
			Assert.equal(marker.providerType, outputObject.providerType, `marker providerType not equal to ${this.objectName} providerType`);
		}
		else {
			Assert.equal(typeof marker.providerType, 'undefined', 'marker providerType should be undefined');
		}

		Assert.deepEqual(marker.locationWhenCreated, inputMarker.location, 'marker location does not match the given location');
		Assert.equal(outputObject.markerIds[n], marker.id, `${this.objectName} ${n}th element of markerIds does not match the ${n}th marker`);
		Assert.equal(outputObject.fileStreamIds[n], marker.fileStreamId || null, `${this.objectName} ${n}th element of fileStreamIds does not match the file streams of the ${n}th marker`);
		if (inputMarker.remotes) {
			Assert.deepEqual(marker.remotesWhenCreated, inputMarker.remotes, 'remotesWhenCreated should be equal to the remotes passed in');
		}

		// validate the reference locations, containing the commit hash and location plus
		// any other additional commit hashes and locations supplied at post creation time
		this.validateReferenceLocations(marker, n);

		// verify the marker has no attributes that should not go to clients
		this.test.validateSanitized(marker, MarkerTestConstants.UNSANITIZED_ATTRIBUTES);
	}

	// validate the reference locations, containing the commit hash and location plus
	// any other additional commit hashes and locations supplied at post creation time
	validateReferenceLocations (marker, n) {
		const markerData = this.inputObject.markers[n];
		const expectedReferenceLocations = (markerData.referenceLocations || []).map(rl => {
			return {
				...rl,
				commitHash: rl.commitHash.toLowerCase()
			};
		});
		if (markerData.commitHash && markerData.location) {
			expectedReferenceLocations.unshift(
				{
					commitHash: markerData.commitHash.toLowerCase(),
					location: markerData.location
				}
			);
		}
		Assert.deepEqual(marker.referenceLocations, expectedReferenceLocations, 'referenceLocations is not correct for single commitHash and location passed in');
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
	getExpectedRepoId (data, n) {
		if (this.test.repoOnTheFly) {
			return data.repos[n].id;
		}
		else if (!this.test.dontExpectRepoId && this.test.repo) {
			return this.test.repo.id;
		}
		else {
			return undefined;
		}
	}

	// get the file stream ID we expect to see in the marker
	getExpectedFileStreamId (data, n) {
		if (this.test.streamOnTheFly) {
			return data.streams[n].id;
		}
		else if (!this.test.dontExpectFileStreamId && this.test.repoStreams && this.test.repoStreams[0]) {
			return this.test.repoStreams[0].id;
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
		const noCommitHashOrLocations = !this.inputObject.markers.find(inputMarker => {
			return inputMarker.commitHash && inputMarker.location;
		});
		if (this.test.dontExpectMarkerLocations || noCommitHashOrLocations) { 
			Assert.equal(typeof data.markerLocations, 'undefined', 'markerLocations should be undefined');
			return;
		}
		const expectedMarkerLocations = [];
		for (let i = 0; i < this.test.expectMarkers; i++) {
			const marker = data.markers[i];
			const inputMarker = this.inputObject.markers[i];
			if (!inputMarker.commitHash || !inputMarker.location) { 
				continue;
			}

			expectedMarkerLocations.push({
				teamId: this.test.team.id,
				streamId: marker.fileStreamId,
				commitHash: marker.commitHashWhenCreated,
				locations: {
					[marker.id]: inputMarker.location
				}
			});
	
			(inputMarker.referenceLocations || []).forEach(rl => {
				expectedMarkerLocations.push({
					teamId: this.test.team.id,
					streamId: marker.fileStreamId,
					commitHash: rl.commitHash.toLowerCase(),
					locations: {
						[marker.id]: rl.location
					}
				});
			});
		}

		Assert.deepEqual(data.markerLocations, expectedMarkerLocations, 'markerLocations location for marker does not match');
	}

	// validate that the created stream matches expectations
	validateStream (data) {
		let errors = [];
		const stream = data.streams.find(stream => stream.createdAt);
		const repo = this.test.repoOnTheFly ? data.repos[0] : this.test.repo;
		const marker = data.markers[0];
		const inputMarker = this.inputObject.markers[0];
		const file = this.test.streamOnTheFly ? inputMarker.file : this.test.repoStreams[0].file;
		let result = (
			((stream.teamId === this.test.team.id) || errors.push('stream teamId does not match')) &&
			((stream.repoId === repo.id) || errors.push('stream repoId does not match the created repo')) &&
			((stream.type === 'file') || errors.push('created stream is not type file')) &&
			((stream.file === file) || errors.push('stream file does not match the given file')) &&
			((stream.id === marker.fileStreamId) || errors.push('marker fileStreamId does not match the created stream'))
		);
		Assert(result === true && errors.length === 0, 'returned stream not valid: ' + errors.join(', '));

		// verify the stream has no attributes that should not go to clients
		this.test.validateSanitized(stream, StreamTestConstants.UNSANITIZED_ATTRIBUTES);
	}

	// validate that the created repo matches expectations
	validateRepo (data) {
		let errors = [];
		const repo = data.repos[0];
		const stream = this.test.streamOnTheFly ? data.streams[0] : this.repoStreams[0];
		const marker = data.markers[0];
		const inputMarker = this.inputObject.markers[0];
		let result = (
			((repo.teamId === this.test.team.id) || errors.push('repo teamId does not match')) &&
			((repo.id === marker.repoId) || errors.push('marker repoId does not match the created repo')) &&
			((stream.repoId === repo.id) || errors.push('stream repoId does not match the created repo'))
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

		// verify the known commit hashes match up
		if (inputMarker.knownCommitHashes) {
			const repoHashes = [...repo.knownCommitHashes];
			repoHashes.sort();
			const sentHashes = inputMarker.knownCommitHashes.map(hash => hash.toLowerCase());
			sentHashes.push(inputMarker.commitHash.toLowerCase());
			sentHashes.sort();
			Assert.deepEqual(repoHashes, sentHashes, 'known commit hashes in returned repo do not match commit hashes sent with the marker');
		}

		// verify the repo has no attributes that should not go to clients
		this.test.validateSanitized(repo, RepoTestConstants.UNSANITIZED_ATTRIBUTES);
	}

	// validate that the repo was updated with the marker's commit hash as a known commit hash
	validateRepoUpdatedWithCommitHash (data) {
		const repo = data.repos[0];
		const inputMarker = this.inputObject.markers[0];
		const expectedVersion = this.test.expectedRepoVersion || 2;
		const expectedRepo = {
			id: this.test.repo.id,
			_id: this.test.repo.id, // DEPRECATE ME
			$set: {
				modifiedAt: Date.now(),
				version: expectedVersion
			},
			$version: {
				before: expectedVersion - 1,
				after: expectedVersion
			}
		};
		if (!this.test.expectMatchByCommitHash) {
			expectedRepo.$addToSet = {
				knownCommitHashes: this.inputObject.markers.map(marker => marker.commitHash.toLowerCase())
			};
		}
		if (this.test.expectMatchByKnownCommitHashes) {
			const normalizedRemote = NormalizeURL(inputMarker.remotes[0]);
			const companyIdentifier = ExtractCompanyIdentifier.getCompanyIdentifier(normalizedRemote);
			expectedRepo.$push = expectedRepo.$push || {};
			expectedRepo.$push.remotes = [
				{
					url: normalizedRemote,
					normalizedUrl: normalizedRemote,
					companyIdentifier
				}
			];
		}
		if (this.test.remotesAdded) {
			expectedRepo.$push = expectedRepo.$push || {};
			expectedRepo.$push.remotes = expectedRepo.$push.remotes || [];
			for (let remote of this.test.remotesAdded) {
				const normalizedRemote = NormalizeURL(remote);
				const companyIdentifier = ExtractCompanyIdentifier.getCompanyIdentifier(normalizedRemote);
				expectedRepo.$push.remotes.push({
					url: normalizedRemote,
					normalizedUrl: normalizedRemote,
					companyIdentifier
				});
			}
		}
		const outputObjectCreated = this.test.codemarkCreatedAfter || this.test.reviewCreatedAfter || this.test.postCreatedAfter;
		Assert(repo.$set.modifiedAt >= outputObjectCreated, `modifiedAt of repo should be set to timestamp greater than or equal to the creation time of the ${this.objectName}`);
		expectedRepo.$set.modifiedAt = repo.$set.modifiedAt;
		Assert.deepEqual(repo, expectedRepo, 'repo in response is not correct');
		this.test.validateSanitized(repo.$set, RepoTestConstants.UNSANITIZED_ATTRIBUTES);
	}

	// validate the returned permalink URL is correct
	validatePermalink (permalink) {
		const type = this.test.permalinkType === 'public' ? 'p' : 'c';
		const origin = ApiConfig.publicApiUrl.replace(/\//g, '\\/');
		const regex = `^${origin}\\/${type}\\/([A-Za-z0-9_-]+)\\/([A-Za-z0-9_-]+)$`;
		const match = permalink.match(new RegExp(regex));
		Assert(match, `returned permalink "${permalink}" does not match /${regex}/`);

		const teamId = this.decodeLinkId(match[1]);
		Assert.equal(teamId, this.test.team.id, 'permalink does not contain proper team ID');
	}

	decodeLinkId (linkId) {
		linkId = linkId
			.replace(/-/g, '+')
			.replace(/_/g, '/');
		return Buffer.from(linkId, 'base64').toString('hex');
	}
}

module.exports = MarkerValidator;
