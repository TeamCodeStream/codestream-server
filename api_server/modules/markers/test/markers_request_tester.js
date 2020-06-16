// handle unit tests for the markers module

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const GetMarkerRequestTester = require('./get_marker/get_marker_request_tester');
const GetMarkersRequestTester = require('./get_markers/get_markers_request_tester');
const PutMarkerRequestTester = require('./put_marker/put_marker_request_tester');

class MarkersRequestTester extends Aggregation(
	GetMarkerRequestTester,
	GetMarkersRequestTester,
	PutMarkerRequestTester
) {
}

module.exports = MarkersRequestTester;
