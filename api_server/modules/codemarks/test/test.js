// handle unit tests for the codemarks module

'use strict';

// make eslint happy
/* globals describe */

const GetCodeMarkRequestTester = require('./get_codemark/test');
const GetCodeMarksRequestTester = require('./get_codemarks/test');
const PostCodeMarkRequestTester = require('./post_codemark/test');
//const PutCodeMarkRequestTester = require('./put_codemark/test');

describe('codemark requests', function() {

	this.timeout(20000);

	describe('GET /codemarks/:id', GetCodeMarkRequestTester.test);
	describe('GET /codemarks', GetCodeMarksRequestTester.test);
	describe('POST /codemarks', PostCodeMarkRequestTester.test);
	//describe('PUT /codemarks/:id', PutCodeMarkRequestTester.test);
});
