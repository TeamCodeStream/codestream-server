'use strict';

// make jshint happy
/* globals describe */

var MarkersRequestTester = require('./markers_request_tester');

var markersRequestTester = new MarkersRequestTester();

describe('marker requests', function() {

	this.timeout(20000);

	describe('GET /markers', markersRequestTester.getMarkersTest);
	describe('PUT /marker-locations', markersRequestTester.putMarkerLocationsTest);

});
