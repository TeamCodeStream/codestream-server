'use strict';

var GetMarkersTest = require('./get_markers_test');
var GetMarkersByIdTest = require('./get_markers_by_id_test');
var NoParameterTest = require('./no_parameter_test');
var StreamNotFoundTest = require('./stream_not_found_test');
var ACLStreamTest = require('./acl_stream_test');
var ACLTeamTest = require('./acl_team_test');
var StreamNoMatchTeamTest = require('./stream_no_match_team_test');
var NoMarkersTest = require('./no_markers_test');
var TooManyIDsTest = require('./too_many_ids_test');
var NoMarkersForCommitTest = require('./no_markers_for_commit_test');
var OneRelationalTest = require('./one_relational_test');
var InvalidRelationalTest = require('./invalid_relational_test');
var MissingMarkersTest = require('./missing_markers_test');
var MarkerSortTest = require('./marker_sort_test');
var SetIdsTest = require('./set_ids_test');
var PaginationTest = require('./pagination_test');

/* jshint -W071 */

class GetMarkersRequestTester {

	getMarkersTest () {
		new GetMarkersTest().test();
		new GetMarkersByIdTest().test();
		new NoParameterTest({ parameter: 'teamId' }).test();
		new NoParameterTest({ parameter: 'streamId' }).test();
		new NoParameterTest({ parameter: 'commitHash' }).test();
		new StreamNotFoundTest().test();
		new ACLStreamTest().test();
		new ACLTeamTest().test();
		new StreamNoMatchTeamTest().test();
		new NoMarkersTest().test();
		new TooManyIDsTest().test();
		new NoMarkersForCommitTest().test();
		new OneRelationalTest().test();
		new InvalidRelationalTest().test();
		new MissingMarkersTest().test();
		new MarkerSortTest({ order: 'ascending' }).test();
		new MarkerSortTest({ order: 'descending' }).test();
		new SetIdsTest({ order: 'ascending' }).test();
		new SetIdsTest({ order: 'descending' }).test();
		new PaginationTest({ order: 'ascending' }).test();
		new PaginationTest({ order: 'descending' }).test();
	}
}

/* jshint +W071 */

module.exports = GetMarkersRequestTester;
