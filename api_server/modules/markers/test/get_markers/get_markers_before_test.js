'use strict';

const GetMarkersTest = require('./get_markers_test');

class GetMarkersBeforeTest extends GetMarkersTest {

	get description () {
		return 'should return the correct markers when requesting markers in a stream before a timestamp';
	}

	// get query parameters to use in the test query
	getQueryParameters () {
		// pick a pivot point, then filter our expected posts based on that pivot,
		// and specify the after parameter to fetch based on the pivot
		const pivot = this.markers[2].createdAt;
		this.expectedMarkers = this.markers.filter(marker => marker.createdAt < pivot);
		const queryParameters = super.getQueryParameters();
		queryParameters.before = `${pivot}`;
		return queryParameters;
	}
}

module.exports = GetMarkersBeforeTest;
