'use strict';

// make jshint happy
/* globals describe */

var Streams_Request_Tester = require('./streams_request_tester');

var streams_request_tester = new Streams_Request_Tester();

describe('stream requests', function() {

	this.timeout(10000);

	describe('GET /streams/:id', streams_request_tester.get_stream_test);
	describe('GET /streams', streams_request_tester.get_streams_test);
	describe('POST /streams', streams_request_tester.post_stream_test);

});
