'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
var GetStreamRequestTester = require('./get_stream/get_stream_request_tester');
var GetStreamsRequestTester = require('./get_streams/get_streams_request_tester');
var PostStreamRequestTester = require('./post_stream/post_stream_request_tester');

class StreamsRequestTester extends Aggregation(
	GetStreamRequestTester,
	GetStreamsRequestTester,
	PostStreamRequestTester
) {
}

module.exports = StreamsRequestTester;
