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
const ApproveRequestTester = require('./approve/test');
const RejectRequestTester = require('./reject/test');
const ReopenRequestTester = require('./reopen/test');
const GetReviewDiffsRequestTester = require('./get_review_diffs/test');
const GetCheckpointReviewDiffsRequestTester = require('./get_checkpoint_review_diffs/test');

describe('review requests', function() {

	this.timeout(20000);

	describe('GET /reviews/:id', GetReviewRequestTester.test);
	describe('GET /reviews', GetReviewsRequestTester.test);
	describe('PUT /reviews/:id', PutReviewRequestTester.test);
	describe('DELETE /reviews/:id', DeleteReviewRequestTester.test);
	describe('PUT /reviews/follow/:id', FollowRequestTester.test);
	describe('PUT /reviews/unfollow/:id', UnfollowRequestTester.test);
	describe('GET /no-auth/unfollow-link/review/:id', UnfollowLinkRequestTester.test);
	describe('PUT /reviews/approve/:id', ApproveRequestTester.test);
	describe('PUT /reviews/reject/:id', RejectRequestTester.test);
	describe('PUT /reviews/reopen/:id', ReopenRequestTester.test);
	describe('GET /reviews/diffs/:id', GetReviewDiffsRequestTester.test);
	describe('GET /reviews/checkpoint-diffs/:id', GetCheckpointReviewDiffsRequestTester.test);
});
