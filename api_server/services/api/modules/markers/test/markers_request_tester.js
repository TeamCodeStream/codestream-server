'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/lib/util/aggregation');
//var GetMarkersRequestTester = require('./get_markers/get_markers_request_tester');
var PutMarkerLocationsRequestTester = require('./put_marker_locations/put_marker_locations_request_tester');

class MarkersRequestTester extends Aggregation(
//	GetMarkersRequestTester,
	PutMarkerLocationsRequestTester
) {
}

module.exports = MarkersRequestTester;
