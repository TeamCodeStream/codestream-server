// handle unit tests for the "GET /streams" request

'use strict';

var GetStreamsByTeamIdAndIdsTest = require('./get_streams_by_team_id_and_ids_test');
var GetStreamsByRepoIdAndIdsTest = require('./get_streams_by_repo_id_and_ids_test');
var GetStreamsOnlyFromTeamTest = require('./get_streams_only_from_team_test');
var GetStreamsOnlyFromRepoTest = require('./get_streams_only_from_repo_test');
var GetFileStreamsByRepoTest = require('./get_file_streams_by_repo_test');
var GetChannelStreamsByTeamTest = require('./get_channel_streams_by_team_test');
var GetDirectStreamsByTeamTest = require('./get_direct_streams_by_team_test');
var GetAllStreamsByTeamTest = require('./get_all_streams_by_team_test');
var GetAllStreamsByRepoTest = require('./get_all_streams_by_repo_test');
var InvalidTypeTest = require('./invalid_type_test');
var NoRepo_IDTest = require('./no_repo_id_test');
var TeamIDRequiredTest = require('./team_id_required_test');
var GetUnreadStreamsTest = require('./get_unread_streams_test');
var GetNoUnreadStreamsTest = require('./get_no_unread_streams_test');
var PaginationTest = require('./pagination_test');
var GetStreamsDefaultSortTest = require('./get_streams_default_sort_test');
var GetStreamsGreaterThanEqualTest = require('./get_streams_greater_than_equal_test');
var GetStreamsGreaterThanTest = require('./get_streams_greater_than_test');
var GetStreamsLessThanEqualTest = require('./get_streams_less_than_equal_test');
var GetStreamsLessThanTest = require('./get_streams_less_than_test');
var GetStreamsLimitTest = require('./get_streams_limit_test');
var GetStreamsSortTest = require('./get_streams_sort_test');
var InvalidParameterTest = require('./invalid_parameter_test');
var OneRelationalTest = require('./one_relational_test');
var CorrectSortOrderTest = require('./correct_sort_order_test');
var ACLTest = require('./acl_test');

class GetStreamsRequestTester {

	getStreamsTest () {
		new GetStreamsByTeamIdAndIdsTest().test();
		new GetStreamsByRepoIdAndIdsTest().test();
		new GetStreamsOnlyFromTeamTest().test();
		new GetStreamsOnlyFromRepoTest().test();
		new GetFileStreamsByRepoTest().test();
		new GetChannelStreamsByTeamTest().test();
		new GetDirectStreamsByTeamTest().test();
		new GetAllStreamsByTeamTest().test();
		new GetAllStreamsByRepoTest().test();
		new InvalidTypeTest().test();
		new NoRepo_IDTest().test();
		new TeamIDRequiredTest().test();
		new GetUnreadStreamsTest().test();
		new GetNoUnreadStreamsTest().test();
		new PaginationTest().test();
		new PaginationTest({ascending: true}).test();
		new PaginationTest({defaultPagination: true}).test();
		new PaginationTest({defaultPagination: true, ascending: true}).test();
		new PaginationTest({defaultPagination: true, tryOverLimit: 150}).test();
		new GetStreamsDefaultSortTest().test();
		new GetStreamsGreaterThanEqualTest().test();
		new GetStreamsGreaterThanTest().test();
		new GetStreamsLessThanEqualTest().test();
		new GetStreamsLessThanTest().test();
		new GetStreamsLimitTest().test();
		new GetStreamsSortTest().test();
		new InvalidParameterTest().test();
		new OneRelationalTest().test();
		new CorrectSortOrderTest().test();
		new ACLTest().test();
	}
}

module.exports = GetStreamsRequestTester;
