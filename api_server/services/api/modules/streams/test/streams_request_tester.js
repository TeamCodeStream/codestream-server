'use strict';

var Aggregation = require(process.env.CI_API_TOP + '/lib/util/aggregation');
//var Get_Stream_Request_Tester = require('./get_stream/get_stream_request_tester');
//var Get_Streams_Request_Tester = require('./get_streams/get_streams_request_tester');
var Post_Stream_Request_Tester = require('./post_stream/post_stream_request_tester');

class Streams_Request_Tester extends Aggregation(
//	Get_Stream_Request_Tester,
//	Get_Streams_Request_Tester,
	Post_Stream_Request_Tester
) {
}

module.exports = Streams_Request_Tester;
