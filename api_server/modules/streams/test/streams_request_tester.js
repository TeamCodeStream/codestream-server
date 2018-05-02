// handle unit tests for the streams module

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const GetStreamRequestTester = require('./get_stream/get_stream_request_tester');
const GetStreamsRequestTester = require('./get_streams/get_streams_request_tester');
const PostStreamRequestTester = require('./post_stream/post_stream_request_tester');
const EditingRequestTester = require('./editing/editing_request_tester');
const PutStreamRequestTester = require('./put_stream/put_stream_request_tester');
const JoinRequestTester = require('./join/join_request_tester');

class StreamsRequestTester extends Aggregation(
	GetStreamRequestTester,
	GetStreamsRequestTester,
	PostStreamRequestTester,
	EditingRequestTester,
	PutStreamRequestTester,
	JoinRequestTester
) {
}

module.exports = StreamsRequestTester;
