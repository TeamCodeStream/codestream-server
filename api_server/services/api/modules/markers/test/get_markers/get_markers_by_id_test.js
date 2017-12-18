'use strict';

var GetMarkersTest = require('./get_markers_test');

class GetMarkersByIdTest extends GetMarkersTest {

	get description () {
		return 'should return the correct markers when requesting markers by ID';
	}

	// get query parameters to use for the test
	getQueryParameters () {
		// we'll restrict to a few of the IDs
		let queryParameters = super.getQueryParameters();
		this.markers = [
			this.markers[0],
			this.markers[2],
			this.markers[3]
		];
		queryParameters.ids = this.markers.map(post => post._id);
		return queryParameters;
	}
}

module.exports = GetMarkersByIdTest;
