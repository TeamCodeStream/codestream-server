// base class for many tests of the "PUT /markers/:id/reference-location" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class CommonInit {

	init (callback) {
		this.expectedVersion = 2;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeMarkerData		// make the data to be used during the update
		], callback);
	}

	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		this.repoOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			creatorIndex: 1,
			wantCodemark: true,
			wantMarker: true,
			markerStreamId: 0,	// will use the existing file stream created for the repo
			commitHash: this.repoFactory.randomCommitHash()
		});
		callback();
	}

	// form the data for the marker update
	makeMarkerData (callback) {
		this.data = {
			commitHash: this.repoFactory.randomCommitHash(),
			location: this.markerFactory.randomLocation(),
			flags: { x: 1, y: '2', z: true } 
		};
		this.marker = this.marker || this.postData[0].markers[0];
		this.expectedData = {
			marker: {
				_id: this.marker.id,	// DEPRECATE ME
				id: this.marker.id,
				$set: {
					version: this.expectedVersion,
					modifiedAt: Date.now() // placeholder
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				},
				$push: {
					referenceLocations: {
						...this.data,
						commitHash: this.data.commitHash.toLowerCase()
					}
				}
			},
			markerLocations: [{
				teamId: this.team.id,
				streamId: this.repoStreams[this.postOptions.markerStreamId].id,
				commitHash: this.data.commitHash.toLowerCase(),
				locations: {
					[this.marker.id]: [ ...this.data.location ]
				}
			}]
		};
		this.expectedMarker = DeepClone(this.marker);
		Object.assign(this.expectedMarker, this.expectedData.marker.$set);
		this.expectedMarker.referenceLocations.push(this.expectedData.marker.$push.referenceLocations);
		this.modifiedAfter = Date.now();
		this.path = `/markers/${this.marker.id}/reference-location`;
		callback();
	}

	// do the actual update
	updateMarker (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/markers/${this.marker.id}/reference-location`,
				data: this.data,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);

	}
}

module.exports = CommonInit;
