'use strict';

var GetPostsTest = require('./get_posts_test');
var GetPostsByMeTest = require('./get_posts_by_me_test');
var GetPostsByOtherTest = require('./get_posts_by_other_test');
var GetPostsNewerThanTest = require('./get_posts_newer_than_test');
var GetChildPostsTest = require('./get_child_posts_test');
var GetPostsByIdTest = require('./get_posts_by_id_test');
var GetPostsLimitTest = require('./get_posts_limit_test');
var GetPostsSortTest = require('./get_posts_sort_test');
var GetPostsDefaultSortTest = require('./get_posts_default_sort_test');
var GetPostsGreaterThanTest = require('./get_posts_greater_than_test');
var GetPostsGreaterThanEqualTest = require('./get_posts_greater_than_equal_test');
var GetPostsLessThanTest = require('./get_posts_less_than_test');
var GetPostsLessThanEqualTest = require('./get_posts_less_than_equal_test');
var PaginationTest = require('./pagination_test');
var InvalidParameterTest = require('./invalid_parameter_test');
var OneRelationalTest = require('./one_relational_test');
var InvalidIDTest = require('./invalid_id_test');
var TeamIDRequiredTest = require('./team_id_required_test');
var StreamIDRequiredTest = require('./stream_id_required_test');
var ACLTeamTest = require('./acl_team_test');
var ACLStreamTest = require('./acl_stream_test');
var ACLTeamFileTest = require('./acl_team_file_test');
var StreamNotFoundTest = require('./stream_not_found_test');
var StreamNoMatchTeamTest = require('./stream_no_match_team_test');

/* jshint -W071 */

class GetPostsRequestTester {

	getPostsTest () {
		new GetPostsTest({type: 'channel'}).test();
		new GetPostsTest({type: 'direct'}).test();
		new GetPostsTest({type: 'file'}).test();
		new GetPostsByMeTest().test();
		new GetPostsByOtherTest().test();
		new GetPostsNewerThanTest().test();
		new GetChildPostsTest().test();
		new GetPostsByIdTest().test();
		new GetPostsLimitTest().test();
		new GetPostsSortTest().test();
		new GetPostsDefaultSortTest().test();
		new GetPostsGreaterThanTest().test();
		new GetPostsGreaterThanEqualTest().test();
		new GetPostsLessThanTest().test();
		new GetPostsLessThanEqualTest().test();
		new PaginationTest().test();
		new PaginationTest({ascending: true}).test();
		new PaginationTest({defaultPagination: true}).test();
		new PaginationTest({defaultPagination: true, ascending: true}).test();
		new PaginationTest({defaultPagination: true, tryOverLimit: true}).test();
		new InvalidParameterTest().test();
		new OneRelationalTest().test();
		new InvalidIDTest().test();
		new TeamIDRequiredTest().test();
		new StreamIDRequiredTest().test();
		new ACLTeamTest().test();
		new ACLStreamTest().test();
		new ACLTeamFileTest().test();
		new StreamNotFoundTest().test();
		new StreamNoMatchTeamTest().test();
	}
}

/* jshint +W071 */

module.exports = GetPostsRequestTester;
