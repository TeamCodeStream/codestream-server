// handle unit tests for the streams module

'use strict';

// make eslint happy
/* globals describe */

var StreamsRequestTester = require('./streams_request_tester');

var streamsRequestTester = new StreamsRequestTester();

describe('stream requests', function() {

	this.timeout(180000);

	describe('GET /streams/:id', streamsRequestTester.getStreamTest);
	describe('GET /streams', streamsRequestTester.getStreamsTest);
	/*
	describe('POST /streams', streamsRequestTester.postStreamTest);
	describe('PUT /editing', streamsRequestTester.editingTest);
	describe('PUT /streams/:id', streamsRequestTester.putStreamTest);
	describe('PUT /join/:id', streamsRequestTester.joinTest);
	describe('PUT /streams/close/:id', streamsRequestTester.closeTest);
	describe('PUT /streams/open/:id', streamsRequestTester.openTest);
	*/
});
