// base class for many tests of the "PUT /markers/:id/move" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const MarkerTestConstants = require('../marker_test_constants');
const NormalizeURL = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/normalize_url');

class MoveTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return a new marker, directive to update the existing marker, and a directive to update the codemark, when moving the code block for a marker';
	}

	get method () {
		return 'put';
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		const expectedCreatedMarker = this.getExpectedCreatedMarker(data);
		const expectedUpdatedMarker = this.getExpectedUpdatedMarker(data);
		const expectedUpdatedCodemark = this.getExpectedUpdatedCodemark(data);
		const expectedMarkerLocations = this.getExpectedMarkerLocations(data);

		Assert.equal(data.repos.length, 1, 'expected repo in response');
		Assert.equal(data.repos[0].id, expectedCreatedMarker.repoId, 'repo in response does not match repo in created marker');
		Assert.equal(data.streams.length, 1, 'expected stream in response');
		Assert.equal(data.streams[0].id, expectedCreatedMarker.fileStreamId, 'stream in response does not match stream in created marker');

		const expectedData = {
			markers: [
				expectedCreatedMarker,
				expectedUpdatedMarker
			],
			codemark: expectedUpdatedCodemark,
			markerLocations: expectedMarkerLocations,
			repos: data.repos,		// we don't verify thisin detail
			streams: data.streams	// we don't verify this in detail
		};

		Assert.deepEqual(data, expectedData, 'response is not correct');

		// verify the marker in the response has no attributes that should not go to clients
		this.validateSanitized(data.markers[0], MarkerTestConstants.UNSANITIZED_ATTRIBUTES);
		this.validateSanitized(data.markers[1].$set, MarkerTestConstants.UNSANITIZED_ATTRIBUTES);
		this.validateSanitized(data.codemark.$set, MarkerTestConstants.UNSANITIZED_CODEMARK_ATTRIBUTES);
	}

	getExpectedCreatedMarker (data) {
		const createdMarker = data.markers[0];
		const createdAt = createdMarker.createdAt;
		const modifiedAt = createdMarker.modifiedAt;
		Assert(createdAt >= this.modifiedAfter, 'createdAt of created marker is not greater than before the test request was made');
		Assert(modifiedAt >= this.modifiedAfter, 'modifiedAt of created marker is not greater than before the test request was made');
		Assert(createdMarker.fileStreamId, 'no fileStreamId made for created marker');
		Assert(createdMarker.repoId, 'no repoId made for created marker');

		return {
			id: createdMarker.id,
			_id: createdMarker.id,	 // DEPRECATE ME
			teamId: this.team.id,
			version: 1,
			createdAt,
			modifiedAt,
			deactivated: false,
			creatorId: this.currentUser.user.id,
			codemarkId: this.marker.codemarkId,
			commitHashWhenCreated: this.data.commitHash.toLowerCase(),
			branchWhenCreated: this.data.branchWhenCreated,
			file: this.data.file,
			repo: NormalizeURL(this.data.remotes[0]),
			fileStreamId: createdMarker.fileStreamId,
			repoId: createdMarker.repoId,
			code: this.data.code,
			postStreamId: this.marker.postStreamId,
			postId: this.marker.postId,
			referenceLocations: this.data.referenceLocations.map(referenceLocation => {
				return {
					commitHash: referenceLocation.commitHash.toLowerCase(),
					location: referenceLocation.location
				};
			}),
			supersedesMarkerId: this.marker.id,
			remotesWhenCreated: this.data.remotes
		};
	}

	getExpectedUpdatedMarker (data) {
		const createdMarker = data.markers[0];
		const modifiedAt = data.markers[1].$set.modifiedAt;
		Assert(modifiedAt >= this.modifiedAfter, 'modifiedAt of updated marker is not greater than before the test request was made');
		return {
			_id: this.marker.id,	// DEPRECATE ME
			id: this.marker.id,
			$set: {
				supersededByMarkerId: createdMarker.id,
				version: 2,
				modifiedAt
			},
			$version: {
				before: 1,
				after: 2
			}
		};
	}

	getExpectedUpdatedCodemark (data) {
		const createdMarker = data.markers[0];
		const codemarkModifiedAt = data.codemark.$set.modifiedAt;
		Assert(codemarkModifiedAt >= this.modifiedAfter, 'modifiedAt of updated codemark is not greater than before the test request was made');
		return {
			_id: this.marker.codemarkId,	// DEPRECATE ME
			id: this.marker.codemarkId,
			$set: {
				version: 2,
				modifiedAt: codemarkModifiedAt
			},
			$version: {
				before: 1,
				after: 2
			},
			$push: {
				markerIds: createdMarker.id,
				fileStreamIds: createdMarker.fileStreamId
			}
		};
	}

	getExpectedMarkerLocations (data) {
		const createdMarker = data.markers[0];
		return [
			{
				teamId: this.team.id,
				streamId: createdMarker.fileStreamId,
				commitHash: this.data.referenceLocations[0].commitHash.toLowerCase(),
				locations: {
					[createdMarker.id]: [ ...this.data.referenceLocations[0].location ]
				}
			},
			{
				teamId: this.team.id,
				streamId: createdMarker.fileStreamId,
				commitHash: this.data.referenceLocations[1].commitHash.toLowerCase(),
				locations: {
					[createdMarker.id]: [ ...this.data.referenceLocations[1].location ]
				}
			},
			{
				teamId: this.team.id,
				streamId: createdMarker.fileStreamId,
				commitHash: this.data.referenceLocations[2].commitHash.toLowerCase(),
				locations: {
					[createdMarker.id]: [ ...this.data.referenceLocations[2].location ]
				}
			}
		];
	}
}

module.exports = MoveTest;
