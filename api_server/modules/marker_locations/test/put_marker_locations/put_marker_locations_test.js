'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class PutMarkerLocationsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		this.streamOptions.type = 'channel';
		this.repoOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			numPosts: 5,
			creatorIndex: 1,
			wantCodemark: true,
			wantMarker: true,
			markerStreamId: 0,	// will use the existing file stream created for the repo
			commitHash: this.repoFactory.randomCommitHash()
		});
		this.path = '/marker-locations';
	}

	get description () {
		return 'should update marker locations when requested';
	}

	get method () {
		return 'put';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.adjustMarkers,		// adjust the markers in the stream for a new commit
			this.setData			// set the data to be used in the request
		], callback);
	}

	// generate some adjusted marker locations
	adjustMarkers (callback) {
		this.markers = this.postData.map(postData => postData.markers[0]);
		this.locations = this.postData.reduce((locations, postData) => {
			const markerId = postData.markers[0].id;
			locations[markerId] = postData.markerLocations[0].locations[markerId];
			return locations;
		}, {});
		this.adjustedMarkerLocations = {};
		this.markers.sort((a, b) => { return a.id.localeCompare(b.id); });	// sort for easy compare to the results
		this.markers.forEach(marker => {
			this.adjustMarker(marker);
		});
		callback();
	}

	// adjust a single marker for saving as a different commit
	adjustMarker (marker) {
		const adjustedLocation = [];
		const location = this.locations[marker.id];
		// totally random adjustments, probably not realistic but it should do the trick
		location.slice(0, 4).forEach(coordinate => {
			const adjustedCoordinate = coordinate + Math.floor(Math.random() * coordinate);
			adjustedLocation.push(adjustedCoordinate);
		});
		this.adjustedMarkerLocations[marker.id] = adjustedLocation;
	}

	// set data to be used in the request
	setData (callback) {
		this.newCommitHash = this.repoFactory.randomCommitHash();	// adjusted marker locations have a new commit
		this.data = {
			teamId: this.team.id,
			streamId: this.repoStreams[0].id,
			commitHash: this.newCommitHash,
			locations: this.adjustedMarkerLocations
		};
		callback();
	}

	// validate empty object, we don't get any other data in the response
	validateResponse (data) {
		Assert(Object.keys(data).length === 0, 'empty data set not returned');
	}
}

module.exports = PutMarkerLocationsTest;
