// handle unit tests for the marker locations module

'use strict';

// make jshint happy
/* globals describe */

var MarkerLocationsRequestTester = require('./marker_locations_request_tester');

var markerLocationsRequestTester = new MarkerLocationsRequestTester();

describe('marker locations requests', function() {

	this.timeout(20000);

	describe('GET /marker-locations', markerLocationsRequestTester.getMarkerLocationsTest);
	describe('PUT /marker-locations', markerLocationsRequestTester.putMarkerLocationsTest);

});
