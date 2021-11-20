// handle unit tests for the New Relic comments module

'use strict';

// make eslint happy
/* globals describe */

const GetNRCommentRequestTester = require('./get_nr_comment/test');
/*
const GetNRCommentsRequestTester = require('./get_nr_comments/test');
*/
const PostNRCommentRequestTester = require('./post_nr_comment/test');
/*
const PutNRCommentRequestTester = require('./put_nr_comment/test');
const DeleteNRCommentRequestTester = require('./delete_nr_comment/test');
*/
const LookupNROrgsRequestTester = require('./lookup_nr_orgs/test');

describe('newrelic comment requests', function() {

	this.timeout(20000);

	/*
	describe('GET /nr-comments/:id', GetNRCommentRequestTester.test);
	*/
	//describe('GET /nr-comments', GetNRCommentsRequestTester.test);
	describe('POST /nr-comments', PostNRCommentRequestTester.test);
	/*
	//describe('PUT /nr-comments/:id', PutNRCommentRequestTester.test);
	//describe('DELETE /nr-comments/:id', DeleteNRCommentRequestTester.test);
	describe('POST /lookup-nr-orgs', LookupNROrgsRequestTester.test);
	*/
});
