// handle unit tests for the "GET /posts" request

'use strict';

var GetPostsTest = require('./get_posts_test');
//var GetPostsByMeTest = require('./get_posts_by_me_test');
//var GetPostsByOtherTest = require('./get_posts_by_other_test');
//var GetPostsNewerThanTest = require('./get_posts_newer_than_test');
var GetChildPostsTest = require('./get_child_posts_test');
var GetPostsByIdTest = require('./get_posts_by_id_test');
var GetPostsLimitTest = require('./get_posts_limit_test');
var GetPostsSortTest = require('./get_posts_sort_test');
var GetPostsDefaultSortTest = require('./get_posts_default_sort_test');
var GetPostsGreaterThanTest = require('./get_posts_greater_than_test');
var GetPostsGreaterThanEqualTest = require('./get_posts_greater_than_equal_test');
var GetPostsLessThanTest = require('./get_posts_less_than_test');
var GetPostsLessThanEqualTest = require('./get_posts_less_than_equal_test');
var GetPostsByPathTest = require('./get_posts_by_path_test');
//var PaginationTest = require('./pagination_test');
var InvalidSeqNumTest = require('./invalid_seqnum_test');
var InvalidSeqNumRangeTest = require('./invalid_seqnum_range_test');
//var SeqNumLimitTest = require('./seqnum_limit_test');
var InvalidParameterTest = require('./invalid_parameter_test');
var OneRelationalTest = require('./one_relational_test');
var InvalidIDTest = require('./invalid_id_test');
var TeamIDRequiredTest = require('./team_id_required_test');
var StreamIDRequiredTest = require('./stream_id_required_test');
var PathRequiredTest = require('./path_required_test');
var ACLTeamTest = require('./acl_team_test');
var ACLStreamTest = require('./acl_stream_test');
var ACLTeamFileTest = require('./acl_team_file_test');
var ACLRepoTest = require('./acl_repo_test');
var StreamNotFoundTest = require('./stream_not_found_test');
var StreamNoMatchTeamTest = require('./stream_no_match_team_test');
var RepoNoMatchTeamTest = require('./repo_no_match_team_test');
var GetPostsBySeqNumTest = require('./get_posts_by_seqnum_test');
var GetPostsBySingleSeqNumTest = require('./get_posts_by_single_seqnum_test');
var NoSeqNumWithRelationalTest = require('./no_seqnum_with_relational_test');
var GetMarkersWithPostsTest = require('./get_markers_with_posts_test');

class GetPostsRequestTester {

	getPostsTest () {
		new GetPostsTest({type: 'channel'}).test();
		new GetPostsTest({type: 'direct'}).test();
		new GetPostsTest({type: 'file'}).test();
		// with indexing, the tests below are disabled pending the need for them, since
		// they would require and index
		// new GetPostsByMeTest().test();
		// new GetPostsByOtherTest().test();
		// new GetPostsNewerThanTest().test();
		new GetChildPostsTest().test();
		new GetPostsByIdTest().test();
		new GetPostsLimitTest().test();
		new GetPostsSortTest().test();
		new GetPostsDefaultSortTest().test();
		new GetPostsGreaterThanTest().test();
		new GetPostsGreaterThanEqualTest().test();
		new GetPostsLessThanTest().test();
		new GetPostsLessThanEqualTest().test();
		new GetPostsByPathTest().test();
		/*
		Disabling these for now, till we go back to 100 posts/page
		new PaginationTest().test();
		new PaginationTest({ascending: true}).test();
		new PaginationTest({defaultPagination: true}).test();
		new PaginationTest({defaultPagination: true, ascending: true}).test();
		new PaginationTest({defaultPagination: true, tryOverLimit: true}).test();
		*/
		new InvalidSeqNumTest().test();
		new InvalidSeqNumRangeTest().test();
		new NoSeqNumWithRelationalTest().test();
		//new SeqNumLimitTest().test();
		new InvalidParameterTest().test();
		new OneRelationalTest().test();
		new InvalidIDTest().test();
		new TeamIDRequiredTest().test();
		new StreamIDRequiredTest().test();
		new PathRequiredTest().test();
		new ACLTeamTest().test();
		new ACLStreamTest().test();
		new ACLTeamFileTest().test();
		new ACLRepoTest().test();
		new StreamNotFoundTest().test();
		new StreamNoMatchTeamTest().test();
		new RepoNoMatchTeamTest().test();
		new GetPostsBySeqNumTest().test();
		new GetPostsBySingleSeqNumTest().test();
		new GetMarkersWithPostsTest().test();
	}
}

module.exports = GetPostsRequestTester;
