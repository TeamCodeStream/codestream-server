'use strict';

// make jshint happy
/* globals describe */

var StreamsRequestTester = require('./streams_request_tester');

var streamsRequestTester = new StreamsRequestTester();

describe('stream requests', function() {

	this.timeout(120000);

	describe('GET /streams/:id', streamsRequestTester.getStreamTest);
	describe('GET /streams', streamsRequestTester.getStreamsTest);
	describe('POST /streams', streamsRequestTester.postStreamTest);

});
