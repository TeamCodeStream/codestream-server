// handle unit tests for the "GET /posts" request

'use strict';

const GetPostsTest = require('./get_posts_test');
const GetPostsWithCodemarksTest = require('./get_posts_with_codemarks_test');
const GetPostsWithMarkersTest = require('./get_posts_with_markers_test');
const GetChildPostsTest = require('./get_child_posts_test');
const StreamIdNoMatchParentTest = require('./stream_id_no_match_parent_test');
const ParentNotFoundTest = require('./parent_not_found_test');
const StreamIdOkWithParentTest = require('./stream_id_ok_with_parent_test');
const GetPostsInObjectStreamTest = require('./get_posts_in_object_stream_test');
const ACLObjectStreamTest = require('./acl_object_stream_test');
const ACLTeamlessObjectStreamTest = require('./acl_teamless_object_stream_test');
const OnlyParentPostIdOkTest = require('./only_parent_post_id_ok_test');
const OnlyStreamIdOkTest = require('./only_stream_id_ok_test');
const OnlyParentPostIdAclTest = require('./only_parent_post_id_acl_test');
const OnlyStreamIdAclTest = require('./only_stream_id_acl_test');
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
const GetPostsBeforeTest = require('./get_posts_before_test');
const GetPostsAfterTest = require('./get_posts_after_test');
const GetPostsBeforeInclusiveTest = require('./get_posts_before_inclusive_test');
const GetPostsAfterInclusiveTest = require('./get_posts_after_inclusive_test');
const GetPostsBeforeAfterTest = require('./get_posts_before_after_test');
const GetPostsBeforeAfterInclusiveTest = require('./get_posts_before_after_inclusive_test');
const InvalidSeqNumTest = require('./invalid_seqnum_test');
const GetPostsWithReviewsTest = require('./get_posts_with_reviews_test');
const GetPostsWithCodeErrorsTest = require('./get_posts_with_code_errors_test');
const ComplexTest = require('./complex_test');
const GetRepliesToCodeErrorTest = require('./get_replies_to_code_error_test');
const ComplexPaginationTest = require('./complex_pagination_test');
const GetComplexPostsBeforeTest = require('./get_complex_posts_before_test');
const GetComplexPostsAfterTest = require('./get_complex_posts_after_test');
const GetComplexPostsSortTest = require('./get_complex_posts_sort_test');
const GetComplexPostsLimitTest = require('./get_complex_posts_limit_test');
const GetComplexPostsDefaultSortTest = require('./get_complex_posts_default_sort_test');

class GetPostsRequestTester {

	getPostsTest () {
		
		/*
		new GetPostsTest().test();
		// NOTE - posting to streams other than the team stream is no longer supported
		//new GetPostsTest({type: 'channel'}).test();
		//new GetPostsTest({type: 'direct'}).test();
		new GetPostsWithCodemarksTest().test();
		new GetPostsWithMarkersTest().test();
		new GetChildPostsTest().test();
		new StreamIdNoMatchParentTest().test();
		new ParentNotFoundTest().test();
		new StreamIdOkWithParentTest().test();
		new GetPostsInObjectStreamTest().test();
		new ACLObjectStreamTest().test();
		new ACLTeamlessObjectStreamTest().test();
		new OnlyParentPostIdOkTest().test();
		new OnlyStreamIdOkTest().test();
		new OnlyParentPostIdAclTest().test();
		new OnlyStreamIdAclTest().test();
		new GetPostsByIdTest().test();
		*/
		new GetPostsLimitTest().test();
		new GetPostsSortTest().test();
		new GetPostsDefaultSortTest().test();
		/*
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
		new StreamNotFoundTest().test();
		new StreamNoMatchTeamTest().test();
		new GetPostsBeforeTest().test();
		new GetPostsAfterTest().test();
		new GetPostsBeforeInclusiveTest().test();
		new GetPostsAfterInclusiveTest().test();
		new GetPostsBeforeAfterTest().test();
		new GetPostsBeforeAfterInclusiveTest().test();
		new InvalidSeqNumTest().test();
		new GetPostsWithReviewsTest().test();
		new GetPostsWithCodeErrorsTest().test();
		new ComplexTest().test();
		new GetRepliesToCodeErrorTest().test();
		new ComplexPaginationTest().test();
		new ComplexPaginationTest({ascending: true}).test();
		new ComplexPaginationTest({defaultPagination: true}).test();
		new ComplexPaginationTest({defaultPagination: true, ascending: true}).test();
		new ComplexPaginationTest({defaultPagination: true, tryOverLimit: true}).test();
		new GetComplexPostsBeforeTest().test();
		new GetComplexPostsAfterTest().test();
		new GetComplexPostsSortTest().test();
		new GetComplexPostsLimitTest().test();
		new GetComplexPostsDefaultSortTest().test();
		*/
	}
}

module.exports = GetPostsRequestTester;
