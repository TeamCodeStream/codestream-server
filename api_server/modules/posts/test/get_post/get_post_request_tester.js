// handle unit tests for the "GET /posts/:id" request

'use strict';

const GetPostTest = require('./get_post_test');
const NotFoundTest = require('./not_found_test');
const ACLTest = require('./acl_test');
const GetPostWithMarkerTest = require('./get_post_with_marker_test');
const GetPostWithCodemarkTest = require('./get_post_with_codemark_test');
const GetPostWithReviewTest = require('./get_post_with_review_test');

class GetPostRequestTester {

	getPostTest () {
		new GetPostTest().test();
		new GetPostTest({ mine: true }).test();
		/* Posting to streams other than the team-stream is no longer supported */
		/*
		new GetPostTest({type: 'channel', mine: true}).test();
		new GetPostTest({type: 'direct', mine: true}).test();
		new GetPostTest({type: 'channel'}).test();
		new GetPostTest({type: 'direct'}).test();
		*/
		new NotFoundTest().test();
		new ACLTest().test();
		/* Posting to streams other than the team-stream is no longer supported */
		/*
		new ACLTest({ type: 'direct' }).test();
		new ACLTest({ type: 'channel' }).test();
		*/
		new GetPostWithCodemarkTest().test();
		new GetPostWithMarkerTest().test();
		new GetPostWithReviewTest().test();
	}
}

module.exports = GetPostRequestTester;
