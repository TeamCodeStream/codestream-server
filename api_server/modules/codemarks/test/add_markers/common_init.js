// base class for many tests of the "PUT /codemarks/:id/add-markers" request

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class CommonInit {

	init(callback) {
		this.expectMarkers = this.expectMarkers || 2;
		this.teamOptions.creatorIndex = (this.teamCreatorIndex !== undefined) ? this.teamCreatorIndex : 1;
		this.repoOptions.creatorIndex = this.teamOptions.creatorIndex;
		this.expectedRepoVersion = 3;
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeCodemark, 		// make the codemark to add to
			this.makeTestData		// make the data to use when issuing the test request
		], callback);
	}

	// make a single codemark to add a tag to
	makeCodemark(callback) {
		const data = {
			streamId: this.teamStream.id
		};
		data.streamId = this.teamStream.id;
		data.codemark = this.codemarkFactory.getRandomCodemarkData();
		data.teamId = this.team.id;
		data.codemark.markers = this.markerFactory.createRandomMarkers(
			3,
			{
				fileStreamId: this.repoStreams[0].id,
				commitHash: this.markerFactory.randomCommitHash()
			}
		);
		let creatorIndex;
		if (this.teamCreatorCreatesCodemark) {
			creatorIndex = 1;
		} else if (this.otherUserCreatesCodemark) {
			creatorIndex = 2;
		} else {
			creatorIndex = 0;
		}
		const token = this.users[creatorIndex].accessToken;
		this.expectedFollowerIds = [this.users[creatorIndex].user.id];
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data,
				token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.codemark = response.codemark;
				this.codemark.markers = response.markers;
				callback();
			}
		);
	}

	// make the data to use when issuing the test request
	makeTestData(callback) {
		this.addedMarkers = [
			this.markerFactory.getRandomMarkerData(),
			this.markerFactory.getRandomMarkerData()
		];
		this.addedMarkers = this.markerFactory.createRandomMarkers(
			this.expectMarkers,
			{
				fileStreamId: this.repoStreams[0].id,
				commitHash: this.useCommitHash || (!this.useRandomCommitHashes && this.markerFactory.randomCommitHash())
			}
		);
		const oldMarkerIds = this.codemark.markerIds;
		const newMarkersPlaceholder = this.addedMarkers.map((marker, n) => `MARKER${n}`);
		const newMarkerIds = this.addMarkersAt ?
			[
				...oldMarkerIds.slice(0, this.addMarkersAt),
				...newMarkersPlaceholder,
				...oldMarkerIds.slice(this.addMarkersAt)
			] : 
			[
				...oldMarkerIds,
				...newMarkersPlaceholder
			];

		const oldFileStreamIds = this.codemark.fileStreamIds;
		const newFileStreamsPlaceholder = this.addedMarkers.map((marker, n) => `FILESTREAM${n}`);
		const newFileStreamIds = this.addMarkersAt ?
			[
				...oldFileStreamIds.slice(0, this.addMarkersAt),
				...newFileStreamsPlaceholder,
				...oldFileStreamIds.slice(this.addMarkersAt)
			] :
			[
				...oldFileStreamIds,
				...newFileStreamsPlaceholder
			];

		this.expectedResponse = {
			codemark: {
				_id: this.codemark.id,	// DEPRECATE ME
				id: this.codemark.id,
				$set: {
					markerIds: newMarkerIds,
					fileStreamIds: newFileStreamIds,
					version: this.expectedVersion,
					modifiedAt: Date.now() // placeholder
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}
		};
	
		this.modifiedAfter = Date.now();
		this.path = `/codemarks/${this.codemark.id}/add-markers`;
		this.data = {
			markers: this.addedMarkers
		};
		if (this.addMarkersAt !== undefined) {
			this.data.at = this.addMarkersAt;
		}
		this.expectedCodemark = DeepClone(this.codemark);
		this.expectedCodemark.markerIds = newMarkerIds;
		callback();
	}

	// perform the actual add of the markers
	addMarkers(callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/codemarks/${this.codemark.id}/add-markers`,
				data: {
					markers: this.addedMarkers,
					at: this.addMarkersAt
				},
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				callback();
			}
		);
	}
}

module.exports = CommonInit;
