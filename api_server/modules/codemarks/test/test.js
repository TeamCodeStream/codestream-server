// handle unit tests for the codemarks module

'use strict';

// make eslint happy
/* globals describe */

const GetCodemarkRequestTester = require('./get_codemark/test');
const GetCodemarksRequestTester = require('./get_codemarks/test');
const PostCodemarkRequestTester = require('./post_codemark/test');
const PutCodemarkRequestTester = require('./put_codemark/test');

describe('codemark requests', function() {

	this.timeout(20000);

	describe('GET /codemarks/:id', GetCodemarkRequestTester.test);
	describe('GET /codemarks', GetCodemarksRequestTester.test);
	describe('POST /codemarks', PostCodemarkRequestTester.test);
	describe('PUT /codemarks/:id', PutCodemarkRequestTester.test);
});
