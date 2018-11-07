'use strict';

const GetMarkersTest = require('./get_markers_test');

class GetMarkersAfterInclusiveTest extends GetMarkersTest {

	get description () {
		return 'should return the correct markers when requesting markers in a stream after a timestamp, inclusive';
	}

	// get query parameters to use in the test query
	getQueryParameters () {
		// pick a pivot point, then filter our expected posts based on that pivot,
		// and specify the after parameter to fetch based on the pivot
		const pivot = this.markers[5].createdAt;
		this.expectedMarkers = this.markers.filter(marker => marker.createdAt >= pivot);
		const queryParameters = super.getQueryParameters();
		queryParameters.after = `${pivot}`;
		queryParameters.inclusive = true;
		return queryParameters;
	}
}

module.exports = GetMarkersAfterInclusiveTest;
