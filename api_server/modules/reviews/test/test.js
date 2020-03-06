// handle unit tests for the codemarks module

'use strict';

// make eslint happy
/* globals describe */

const GetReviewRequestTester = require('./get_review/test');
const GetReviewsRequestTester = require('./get_reviews/test');
const PutReviewRequestTester = require('./put_review/test');
const DeleteReviewRequestTester = require('./delete_review/test');
const FollowRequestTester = require('./follow/test');
const UnfollowRequestTester = require('./unfollow/test');
const UnfollowLinkRequestTester = require('./unfollow_link/test');

describe('review requests', function() {

	this.timeout(20000);

	describe('GET /reviews/:id', GetReviewRequestTester.test);
	describe('GET /reviews', GetReviewsRequestTester.test);
	describe('PUT /reviews/:id', PutReviewRequestTester.test);
	describe('DELETE /reviews/:id', DeleteReviewRequestTester.test);
	describe('PUT /reviews/follow/:id', FollowRequestTester.test);
	describe('PUT /reviews/unfollow/:id', UnfollowRequestTester.test);
	describe('GET /no-auth/unfollow-link/review/:id', UnfollowLinkRequestTester.test);
});
