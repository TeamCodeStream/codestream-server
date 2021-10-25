// handle unit tests for the "GET /posts" request

'use strict';

const GetPostsTest = require('./get_posts_test');
const GetPostsWithCodemarksTest = require('./get_posts_with_codemarks_test');
const GetPostsWithMarkersTest = require('./get_posts_with_markers_test');
const GetChildPostsTest = require('./get_child_posts_test');
const GetPostsByIdTest = require('./get_posts_by_id_test');
const GetPostsLimitTest = require('./get_posts_limit_test');
const GetPostsSortTest = require('./get_posts_sort_test');
const GetPostsDefaultSortTest = require('./get_posts_default_sort_test');
const PaginationTest = require('./pagination_test');
const InvalidParameterTest = require('./invalid_parameter_test');
const TeamIDRequiredTest = require('./team_id_required_test');
//const StreamIDRequiredTest = require('./stream_id_required_test');
const ACLTeamTest = require('./acl_team_test');
//const ACLStreamTest = require('./acl_stream_test');
const StreamNotFoundTest = require('./stream_not_found_test');
const StreamNoMatchTeamTest = require('./stream_no_match_team_test');
//const StreamIdIgnoredTest = require('./stream_id_ignored_test');
const GetPostsBeforeTest = require('./get_posts_before_test');
const GetPostsAfterTest = require('./get_posts_after_test');
const GetPostsBeforeInclusiveTest = require('./get_posts_before_inclusive_test');
const GetPostsAfterInclusiveTest = require('./get_posts_after_inclusive_test');
const GetPostsBeforeAfterTest = require('./get_posts_before_after_test');
const GetPostsBeforeAfterInclusiveTest = require('./get_posts_before_after_inclusive_test');
const InvalidSeqNumTest = require('./invalid_seqnum_test');
const GetPostsWithReviewsTest = require('./get_posts_with_reviews_test');
const GetPostsWithCodeErrorsTest = require('./get_posts_with_code_errors_test');
const NeedIncludeFollowedTest = require('./need_include_followed_test');
const ComplexTest = require('./complex_test');
const GetRepliesToCodeErrorTest = require('./get_replies_to_code_error_test');
const TeamIdIgnoredForRepliesToCodeErrorTest = require('./team_id_ignored_for_replies_to_code_error_test');

class GetPostsRequestTester {

	getPostsTest () {
		
		new GetPostsTest().test();
		// NOTE - posting to streams other than the team stream is no longer supported
		//new GetPostsTest({type: 'channel'}).test();
		//new GetPostsTest({type: 'direct'}).test();
		new GetPostsWithCodemarksTest().test();
		new GetPostsWithMarkersTest().test();
		new GetChildPostsTest().test();
		new GetPostsByIdTest().test();
		new GetPostsLimitTest().test();
		new GetPostsSortTest().test();
		new GetPostsDefaultSortTest().test();
		new PaginationTest().test();
		new PaginationTest({ascending: true}).test();
		new PaginationTest({defaultPagination: true}).test();
		new PaginationTest({defaultPagination: true, ascending: true}).test();
		new PaginationTest({defaultPagination: true, tryOverLimit: true}).test();
		new InvalidParameterTest().test();
		new TeamIDRequiredTest().test();
		//new StreamIDRequiredTest().test();
		new ACLTeamTest().test();
		//new ACLStreamTest().test();
		//new StreamNotFoundTest().test();
		//new StreamNoMatchTeamTest().test();
		//new StreamIdIgnoredTest().test();
		new GetPostsBeforeTest().test();
		new GetPostsAfterTest().test();
		new GetPostsBeforeInclusiveTest().test();
		new GetPostsAfterInclusiveTest().test();
		new GetPostsBeforeAfterTest().test();
		new GetPostsBeforeAfterInclusiveTest().test();
		//new InvalidSeqNumTest().test();
		new GetPostsWithReviewsTest().test();
		new GetPostsWithCodeErrorsTest().test();
		//new NeedIncludeFollowedTest().test();
		new ComplexTest().test();
		new GetRepliesToCodeErrorTest().test();
		new TeamIdIgnoredForRepliesToCodeErrorTest().test();
	}
}

module.exports = GetPostsRequestTester;
