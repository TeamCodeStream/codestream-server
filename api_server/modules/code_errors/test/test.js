// handle unit tests for the code errors module

'use strict';

// make eslint happy
/* globals describe */

const GetCodeErrorRequestTester = require('./get_code_error/test');
const GetCodeErrorsRequestTester = require('./get_code_errors/test');
const PutCodeErrorRequestTester = require('./put_code_error/test');
const DeleteCodeErrorRequestTester = require('./delete_code_error/test');
const FollowRequestTester = require('./follow/test');
const UnfollowRequestTester = require('./unfollow/test');
const UnfollowLinkRequestTester = require('./unfollow_link/test');
const ClaimCodeErrorRequestTester = require('./claim_code_error/test');

describe('code error requests', function() {

	this.timeout(20000);

	/*
	describe('GET /code-errors/:id', GetCodeErrorRequestTester.test);
	describe('GET /code-errors', GetCodeErrorsRequestTester.test);
	describe('PUT /code-errors/:id', PutCodeErrorRequestTester.test);
	describe('DELETE /code-errors/:id', DeleteCodeErrorRequestTester.test);
	describe('PUT /code-errors/follow/:id', FollowRequestTester.test);
	describe('PUT /code-errors/unfollow/:id', UnfollowRequestTester.test);
	describe('GET /no-auth/unfollow-link/code-error/:id', UnfollowLinkRequestTester.test);
	*/
	describe('POST /code-errors/claim/:teamId', ClaimCodeErrorRequestTester.test);
});
