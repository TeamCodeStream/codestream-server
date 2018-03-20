// handle unit tests for the markers module

'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
var GetMarkerRequestTester = require('./get_marker/get_marker_request_tester');
var GetMarkersRequestTester = require('./get_markers/get_markers_request_tester');
var PutMarkerRequestTester = require('./put_marker/put_marker_request_tester');

class MarkersRequestTester extends Aggregation(
	GetMarkerRequestTester,
	GetMarkersRequestTester,
	PutMarkerRequestTester
) {
}

module.exports = MarkersRequestTester;
