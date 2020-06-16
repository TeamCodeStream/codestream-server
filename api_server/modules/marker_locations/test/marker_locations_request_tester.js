// handle unit tests associated with the marker locations module

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const GetMarkerLocationsRequestTester = require('./get_marker_locations/get_marker_locations_request_tester');
const PutMarkerLocationsRequestTester = require('./put_marker_locations/put_marker_locations_request_tester');

class MarkerLocationsRequestTester extends Aggregation(
	GetMarkerLocationsRequestTester,
	PutMarkerLocationsRequestTester,
) {
}

module.exports = MarkerLocationsRequestTester;
