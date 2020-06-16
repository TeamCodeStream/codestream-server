'use strict';

const PutMarkerLocationsTest = require('./put_marker_locations_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class PutMarkerLocationsFetchTest extends PutMarkerLocationsTest {

	get description () {
		return 'should properly update marker locations when requested, checked by fetching markers';
	}

	get method () {
		return 'get';
	}

	// before the test runs..
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// create team/repo/stream/markers
			this.setMarkerLocations,	// put the marker locations to the server
			this.setPath	// set the path, this is what we'll use to fetch the markers to verify they are correct
		], callback);
	}

	// set marker locations for the markers by calling PUT /marker-locations
	// the actual test is reading these marker locations and verifying they are correct
	setMarkerLocations (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/marker-locations',
				data: this.data,
				token: this.token
			},
			callback
		);
	}

	// set path for the test request
	setPath (callback) {
		// the actual test is the fetch of the marker locations we just saved, and verifting they are correct
		this.path = `/marker-locations?teamId=${this.team.id}&streamId=${this.repoStreams[0].id}&commitHash=${this.newCommitHash}`;
		delete this.data;	// don't need this anymore, data is in the query parameters
		callback();
	}

	// validate that the response is correct
	validateResponse (data) {
		// verify all the marker locations are the same as what we saved
		const markerLocations = data.markerLocations;
		const locations = markerLocations.locations;
		Assert(Object.keys(locations).length === this.markers.length, 'did not receive marker locations for all markers');
		Object.keys(locations).forEach(markerId => {
			this.validateMarker(markerId, locations[markerId]);
		});
	}

	// validate an individual marker we retrieved from the server
	validateMarker (markerId, location) {
		const marker = this.markers.find(marker => marker.id === markerId);
		Assert(marker, 'got markerId that does not correspond to a marker created by this request');
		Assert.deepEqual(this.adjustedMarkerLocations[marker.id], location, 'returned location does not match');
	}
}

module.exports = PutMarkerLocationsFetchTest;
