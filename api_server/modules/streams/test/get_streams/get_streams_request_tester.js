// handle unit tests for the "GET /streams" request

'use strict';

const GetStreamsByTeamIdAndIdsTest = require('./get_streams_by_team_id_and_ids_test');
const GetStreamsByRepoIdAndIdsTest = require('./get_streams_by_repo_id_and_ids_test');
const GetStreamsOnlyFromTeamTest = require('./get_streams_only_from_team_test');
const GetStreamsOnlyFromRepoTest = require('./get_streams_only_from_repo_test');
const GetFileStreamsByRepoTest = require('./get_file_streams_by_repo_test');
const GetChannelStreamsByTeamTest = require('./get_channel_streams_by_team_test');
const GetDirectStreamsByTeamTest = require('./get_direct_streams_by_team_test');
const GetAllStreamsByTeamTest = require('./get_all_streams_by_team_test');
const GetAllStreamsByRepoTest = require('./get_all_streams_by_repo_test');
const GetPublicStreamsTest = require('./get_public_streams_test');
const GetTeamStreamsTest = require('./get_team_streams_test');
const InvalidTypeTest = require('./invalid_type_test');
const NoRepoIDTest = require('./no_repo_id_test');
const TeamIDRequiredTest = require('./team_id_required_test');
const GetUnreadStreamsTest = require('./get_unread_streams_test');
const GetNoUnreadStreamsTest = require('./get_no_unread_streams_test');
//const PaginationTest = require('./pagination_test');
const GetStreamsDefaultSortTest = require('./get_streams_default_sort_test');
const GetStreamsGreaterThanEqualTest = require('./get_streams_greater_than_equal_test');
const GetStreamsGreaterThanTest = require('./get_streams_greater_than_test');
const GetStreamsLessThanEqualTest = require('./get_streams_less_than_equal_test');
const GetStreamsLessThanTest = require('./get_streams_less_than_test');
const GetStreamsLimitTest = require('./get_streams_limit_test');
const GetStreamsSortTest = require('./get_streams_sort_test');
const InvalidParameterTest = require('./invalid_parameter_test');
const OneRelationalTest = require('./one_relational_test');
const CorrectSortOrderTest = require('./correct_sort_order_test');
const ACLTest = require('./acl_test');

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
		new GetPublicStreamsTest().test();
		new GetTeamStreamsTest().test();
		new InvalidTypeTest().test();
		new NoRepoIDTest().test();
		new TeamIDRequiredTest().test();
		new GetUnreadStreamsTest().test();
		new GetNoUnreadStreamsTest().test();
		/*
		new PaginationTest().test();
		new PaginationTest({ascending: true}).test();
		new PaginationTest({defaultPagination: true}).test();
		new PaginationTest({defaultPagination: true, ascending: true}).test();
		new PaginationTest({defaultPagination: true, tryOverLimit: 150}).test();
		*/
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
