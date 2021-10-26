// handles unit tests for "GET /marker-locations" requests

'use strict';

const GetMarkerLocationsTest = require('./get_marker_locations_test');
const NoParameterTest = require('./no_parameter_test');
const StreamNotFoundTest = require('./stream_not_found_test');
const ACLStreamTest = require('./acl_stream_test');
const ACLTeamTest = require('./acl_team_test');
const StreamNoMatchTeamTest = require('./stream_no_match_team_test');
const NoMarkerLocationsForCommitTest = require('./no_marker_locations_for_commit_test');

class GetMarkerLocationsRequestTester {

	getMarkerLocationsTest () {
		new GetMarkerLocationsTest().test();
		new NoParameterTest({ parameter: 'teamId' }).test();
		new NoParameterTest({ parameter: 'streamId' }).test();
		new NoParameterTest({ parameter: 'commitHash' }).test();
		new StreamNotFoundTest().test();
		//new ACLStreamTest().test();
		new ACLTeamTest().test();
		new StreamNoMatchTeamTest().test();
		new NoMarkerLocationsForCommitTest().test();
	}
}

module.exports = GetMarkerLocationsRequestTester;
