'use strict';

var GetMarkersTest = require('./get_markers_test');
var GetMarkersByIdTest = require('./get_markers_by_id_test');
var MarkerLocationsTest = require('./marker_locations_test');
var NoParameterTest = require('./no_parameter_test');
var StreamNotFoundTest = require('./stream_not_found_test');
var ACLStreamTest = require('./acl_stream_test');
var ACLTeamTest = require('./acl_team_test');
var StreamNoMatchTeamTest = require('./stream_no_match_team_test');
var TooManyIDsTest = require('./too_many_ids_test');

/* jshint -W071 */

class GetMarkersRequestTester {

	getMarkersTest () {
		new GetMarkersTest().test();
		new GetMarkersByIdTest().test();
		new MarkerLocationsTest().test();
		new NoParameterTest({ parameter: 'teamId' }).test();
		new NoParameterTest({ parameter: 'streamId' }).test();
		new StreamNotFoundTest().test();
		new ACLStreamTest().test();
		new ACLTeamTest().test();
		new StreamNoMatchTeamTest().test();
		new TooManyIDsTest().test();
	}
}

/* jshint +W071 */

module.exports = GetMarkersRequestTester;
