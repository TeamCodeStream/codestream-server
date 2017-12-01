'use strict';

var GetMarkerLocationsTest = require('./get_marker_locations_test');
var Assert = require('assert');

class NoMarkerLocationsForCommitTest extends GetMarkerLocationsTest {

	get description () {
		return 'should return an empty object if there are no marker locations for a given commit';
	}

	getQueryParameters () {
		let queryParameters = super.getQueryParameters();
		queryParameters.commitHash = this.postFactory.randomCommitHash();
		return queryParameters;
	}

	validateResponse (data) {
		Assert(typeof data.markerLocations === 'object', 'markerLocations is not an object');
		Assert(Object.keys(data.markerLocations).length === 0, 'markerLocations is not an empty object');
	}
}

module.exports = NoMarkerLocationsForCommitTest;
