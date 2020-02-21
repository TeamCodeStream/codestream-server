// handle unit tests for the codemarks module

'use strict';

// make eslint happy
/* globals describe */

const GetReviewRequestTester = require('./get_review/test');
const GetReviewsRequestTester = require('./get_reviews/test');
const PutReviewRequestTester = require('./put_review/test');
const DeleteReviewRequestTester = require('./delete_review/test');
const AddTagRequestTester = require('./add_tag/test');
const RemoveTagRequestTester = require('./remove_tag/test');

describe('review requests', function() {

	this.timeout(20000);

	describe('GET /reviews/:id', GetReviewRequestTester.test);
	describe('GET /reviews', GetReviewsRequestTester.test);
	describe('PUT /reviews/:id', PutReviewRequestTester.test);
	describe('DELETE /reviews/:id', DeleteReviewRequestTester.test);
	describe('PUT /reviews/:id/add-tag', AddTagRequestTester.test);
	describe('PUT /reviews/:id/remove-tag', RemoveTagRequestTester.test);
});
