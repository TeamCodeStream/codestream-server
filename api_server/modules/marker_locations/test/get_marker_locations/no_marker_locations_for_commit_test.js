'use strict';

const GetMarkerLocationsTest = require('./get_marker_locations_test');
const Assert = require('assert');

class NoMarkerLocationsForCommitTest extends GetMarkerLocationsTest {

	get description () {
		return 'should return an empty object if there are no marker locations for a given commit';
	}

	getQueryParameters () {
		const queryParameters = super.getQueryParameters();
		queryParameters.commitHash = this.repoFactory.randomCommitHash();	// change the commit hash
		return queryParameters;
	}

	// we should get an empty response, no marker locations for this commit and stream
	validateResponse (data) {
		Assert(typeof data.markerLocations === 'object', 'markerLocations is not an object');
		Assert(Object.keys(data.markerLocations).length === 0, 'markerLocations is not an empty object');
	}
}

module.exports = NoMarkerLocationsForCommitTest;
