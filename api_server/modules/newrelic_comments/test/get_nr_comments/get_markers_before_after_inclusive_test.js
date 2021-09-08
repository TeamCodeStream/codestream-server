'use strict';

const GetMarkersTest = require('./get_markers_test');

class GetMarkersBeforeAfterInclusiveTest extends GetMarkersTest {

	get description () {
		return 'should return the correct markers when requesting markers in a stream before and after a timestamp, inclusive';
	}

	// get query parameters to use in the test query
	getQueryParameters () {
		// pick bracket points, then filter our expected codemarks based on the brackets,
		// and specify the before and after parameters to fetch based on the brackets
		const beforePivot = this.markers[7].createdAt;
		const afterPivot = this.markers[3].createdAt;
		this.expectedMarkers = this.markers.filter(marker => marker.createdAt <= beforePivot && marker.createdAt >= afterPivot);
		const queryParameters = super.getQueryParameters();
		Object.assign(queryParameters, {
			before: beforePivot,
			after: afterPivot,
			inclusive: true
		});
		return queryParameters;
	}
}

module.exports = GetMarkersBeforeAfterInclusiveTest;
