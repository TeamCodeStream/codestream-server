// handle unit tests for the "GET /reviews" request to fetch code review objects

'use strict';

const GetReviewsTest = require('./get_reviews_test');
const GetReviewsWithMarkersTest = require('./get_reviews_with_markers_test');
const GetReviewsBeforeTest = require('./get_reviews_before_test');
const GetReviewsAfterTest = require('./get_reviews_after_test');
const GetReviewsBeforeInclusiveTest = require('./get_reviews_before_inclusive_test');
const GetReviewsAfterInclusiveTest = require('./get_reviews_after_inclusive_test');
const GetReviewsBeforeAfterTest = require('./get_reviews_before_after_test');
const GetReviewsBeforeAfterInclusiveTest = require('./get_reviews_before_after_inclusive_test');
const ACLTest = require('./acl_test');
const TeamIDRequiredTest = require('./team_id_required_test');
const TeamNotFoundTest = require('./team_not_found_test');
const NoLastAcitivtyAtAndStreamIdTest = require('./no_last_activity_at_and_stream_id_test');
const GetReviewsByStreamIdTest = require('./get_reviews_by_stream_id_test');
const GetReviewsByLastActivityTest = require('./get_reviews_by_last_activity_test');
const GetReviewsBeforeLastActivityTest = require('./get_reviews_before_last_activity_test');
const GetReviewsAfterLastActivityTest = require('./get_reviews_after_last_activity_test');
const GetReviewsBeforeLastActivityInclusiveTest = require('./get_reviews_before_last_activity_inclusive_test');
const GetReviewsAfterLastActivityInclusiveTest = require('./get_reviews_after_last_activity_inclusive_test');
const GetReviewsBeforeAfterLastActivityTest = require('./get_reviews_before_after_last_activity_test');
const GetReviewsBeforeAfterLastActivityInclusiveTest = require('./get_reviews_before_after_last_activity_inclusive_test');

class GetReviewsRequestTester {

	test () {
		new GetReviewsTest().test();
		new GetReviewsWithMarkersTest().test();
		new GetReviewsBeforeTest().test();
		new GetReviewsAfterTest().test();
		new GetReviewsBeforeInclusiveTest().test();
		new GetReviewsAfterInclusiveTest().test();
		new GetReviewsBeforeAfterTest().test();
		new GetReviewsBeforeAfterInclusiveTest().test();
		new ACLTest().test();
		new TeamIDRequiredTest().test();
		new TeamNotFoundTest().test();
		new NoLastAcitivtyAtAndStreamIdTest().test();
		new GetReviewsByStreamIdTest().test();
		new GetReviewsByLastActivityTest().test();
		new GetReviewsBeforeLastActivityTest().test();
		new GetReviewsAfterLastActivityTest().test();
		new GetReviewsBeforeLastActivityInclusiveTest().test();
		new GetReviewsAfterLastActivityInclusiveTest().test();
		new GetReviewsBeforeAfterLastActivityTest().test();
		new GetReviewsBeforeAfterLastActivityInclusiveTest().test();
	}
}

module.exports = new GetReviewsRequestTester();
