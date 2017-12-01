'use strict';

var GetMarkerLocationsTest = require('./get_marker_locations_test');
var NoParameterTest = require('./no_parameter_test');
var StreamNotFoundTest = require('./stream_not_found_test');
var ACLStreamTest = require('./acl_stream_test');
var ACLTeamTest = require('./acl_team_test');
var StreamNoMatchTeamTest = require('./stream_no_match_team_test');
var NoMarkerLocationsForCommitTest = require('./no_marker_locations_for_commit_test');

/* jshint -W071 */

class GetMarkerLocationsRequestTester {

	getMarkerLocationsTest () {
		new GetMarkerLocationsTest().test();
		new NoParameterTest({ parameter: 'teamId' }).test();
		new NoParameterTest({ parameter: 'streamId' }).test();
		new NoParameterTest({ parameter: 'commitHash' }).test();
		new StreamNotFoundTest().test();
		new ACLStreamTest().test();
		new ACLTeamTest().test();
		new StreamNoMatchTeamTest().test();
		new NoMarkerLocationsForCommitTest().test();
	}
}

/* jshint +W071 */

module.exports = GetMarkerLocationsRequestTester;
