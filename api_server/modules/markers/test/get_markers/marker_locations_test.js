'use strict';

const GetMarkersTest = require('./get_markers_test');
const Assert = require('assert');
const MarkerTestConstants = require('../marker_test_constants');

class MarkerLocationsTest extends GetMarkersTest {

	get description () {
		return 'should return the marker locations if commit hash is provided in the request';
	}

	// get query parameters to use in the test query
	getQueryParameters () {
		// include the commit hash so we get the locations
		const queryParameters = super.getQueryParameters();
		queryParameters.commitHash = this.postOptions.commitHash;
		return queryParameters;
	}

	// validate that we got the marker locations, not just the markers
	validateResponse (data) {
		Assert(typeof data.markerLocations === 'object', 'markerLocations is not an object');
		const markerLocations = data.markerLocations;
		Assert(markerLocations.teamId === this.team._id, 'teamId does not match');
		Assert(markerLocations.streamId === this.repoStreams[0]._id, 'teamId does not match');
		Assert(markerLocations.commitHash === this.postOptions.commitHash.toLowerCase(), 'commitHash does not match');
		const locations = markerLocations.locations;
		Assert.equal(Object.keys(locations).length, this.postOptions.numPosts, 'number of locations does not match the number of posts created');
		Object.keys(locations).forEach(markerId => {
			const marker = this.markers.find(marker => marker._id === markerId);
			Assert(marker, 'did not find a match for received marker location');
			Assert.deepEqual(locations[markerId], this.locations[markerId], 'location of received marker does not match that of the created marker');
		});
		this.validateSanitized(markerLocations, MarkerTestConstants.UNSANITIZED_MARKER_LOCATIONS_ATTRIBUTES);
		super.validateResponse(data);
	}
}

module.exports = MarkerLocationsTest;
