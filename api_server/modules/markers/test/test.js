// handle unit tests for the markers module

'use strict';

// make eslint happy
/* globals describe */

const MarkersRequestTester = require('./markers_request_tester');

const ReferenceLocationRequestTester = require('./reference_location/test');

const markersRequestTester = new MarkersRequestTester();

describe('marker requests', function() {

	this.timeout(20000);

	describe('GET /markers/:id', markersRequestTester.getMarkerTest);
	describe('GET /markers', markersRequestTester.getMarkersTest);
	describe('PUT /markers/:id', markersRequestTester.putMarkerTest);
	describe('PUT /markers/:id/referenceLocation', ReferenceLocationRequestTester.test);
});
