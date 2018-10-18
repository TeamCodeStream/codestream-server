// handle unit tests for the markers module

'use strict';

// make eslint happy
/* globals describe */

const MarkersRequestTester = require('./markers_request_tester');

const markersRequestTester = new MarkersRequestTester();

describe('marker requests', function() {

	this.timeout(20000);

	describe('GET /markers/:id', markersRequestTester.getMarkerTest);
	describe('GET /markers', markersRequestTester.getMarkersTest);
	describe('POST /markers', markersRequestTester.postMarkerTest);
	describe('PUT /markers/:id', markersRequestTester.putMarkerTest);
});
