// handle unit tests associated with the marker locations module

'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/lib/util/aggregation');
var GetMarkerLocationsRequestTester = require('./get_marker_locations/get_marker_locations_request_tester');
var PutMarkerLocationsRequestTester = require('./put_marker_locations/put_marker_locations_request_tester');

class MarkerLocationsRequestTester extends Aggregation(
	GetMarkerLocationsRequestTester,
	PutMarkerLocationsRequestTester
) {
}

module.exports = MarkerLocationsRequestTester;
