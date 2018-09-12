// handle unit tests for the "GET /posts" request

'use strict';

const GetPostsTest = require('./get_posts_test');
//const GetPostsByMeTest = require('./get_posts_by_me_test');
//const GetPostsByOtherTest = require('./get_posts_by_other_test');
//const GetPostsNewerThanTest = require('./get_posts_newer_than_test');
const GetChildPostsTest = require('./get_child_posts_test');
const GetPostsByIdTest = require('./get_posts_by_id_test');
const GetPostsLimitTest = require('./get_posts_limit_test');
const GetPostsSortTest = require('./get_posts_sort_test');
const GetPostsDefaultSortTest = require('./get_posts_default_sort_test');
const GetPostsGreaterThanTest = require('./get_posts_greater_than_test');
const GetPostsGreaterThanEqualTest = require('./get_posts_greater_than_equal_test');
const GetPostsLessThanTest = require('./get_posts_less_than_test');
const GetPostsLessThanEqualTest = require('./get_posts_less_than_equal_test');
const GetPostsByPathTest = require('./get_posts_by_path_test');
//const PaginationTest = require('./pagination_test');
const InvalidSeqNumTest = require('./invalid_seqnum_test');
const InvalidSeqNumRangeTest = require('./invalid_seqnum_range_test');
//const SeqNumLimitTest = require('./seqnum_limit_test');
const InvalidParameterTest = require('./invalid_parameter_test');
const OneRelationalTest = require('./one_relational_test');
const InvalidIDTest = require('./invalid_id_test');
const TeamIDRequiredTest = require('./team_id_required_test');
const StreamIDRequiredTest = require('./stream_id_required_test');
const PathRequiredTest = require('./path_required_test');
const ACLTeamTest = require('./acl_team_test');
const ACLStreamTest = require('./acl_stream_test');
const ACLTeamFileTest = require('./acl_team_file_test');
const ACLRepoTest = require('./acl_repo_test');
const StreamNotFoundTest = require('./stream_not_found_test');
const StreamNoMatchTeamTest = require('./stream_no_match_team_test');
const RepoNoMatchTeamTest = require('./repo_no_match_team_test');
const GetPostsBySeqNumTest = require('./get_posts_by_seqnum_test');
const GetPostsBySeqNumsTest = require('./get_posts_by_seqnums_test');
const NoRangeAndSeqNumsTest = require('./no_range_and_seqnums_test');
const TooManySeqNumsTest = require('./too_many_seqnums_test');
const InvalidSeqNumsTest = require('./invalid_seqnums_test');
const GetPostsBySingleSeqNumTest = require('./get_posts_by_single_seqnum_test');
const NoSeqNumWithRelationalTest = require('./no_seqnum_with_relational_test');
const GetMarkersWithPostsTest = require('./get_markers_with_posts_test');

class GetPostsRequestTester {

	getPostsTest () {
		new GetPostsTest({type: 'channel'}).test();
		new GetPostsTest({type: 'direct'}).test();
		new GetPostsTest({type: 'file'}).test();
		// with indexing, the tests below are disabled pending the need for them, since
		// they would require an index
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
		new GetPostsBySeqNumsTest().test();
		new NoRangeAndSeqNumsTest().test();
		new TooManySeqNumsTest().test();
		new InvalidSeqNumsTest().test();
		new GetPostsBySingleSeqNumTest().test();
		new GetMarkersWithPostsTest().test();
	}
}

module.exports = GetPostsRequestTester;
