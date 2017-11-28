'use strict';

var GetMarkersTest = require('./get_markers_test');
var GetMarkersByIdTest = require('./get_markers_by_id_test');
var InvalidParameterTest = require('./invalid_parameter_test');
var TeamIDRequiredTest = require('./team_id_required_test');
var StreamIDRequiredTest = require('./stream_id_required_test');
var CommitHashRequiredTest = require('./commit_hash_required_test');
var ACLTeamTest = require('./acl_team_test');
var ACLStreamTest = require('./acl_stream_test');
var StreamNotFoundTest = require('./stream_not_found_test');
var StreamNoMatchTeamTest = require('./stream_no_match_team_test');
var NoMarkersTest = require('./no_markers_test');

/* jshint -W071 */

class GetMarkersRequestTester {

	getMarkersTest () {
		new GetMarkersTest().test();
		new GetMarkersByIdTest().test();
		new InvalidParameterTest().test();
		new TeamIDRequiredTest().test();
		new StreamIDRequiredTest().test();
		new CommitHashRequiredTest().test();
		new ACLTeamTest().test();
		new ACLStreamTest().test();
		new StreamNotFoundTest().test();
		new StreamNoMatchTeamTest().test();
		new NoMarkersTest().test();
	}
}

/* jshint +W071 */

module.exports = GetMarkersRequestTester;
