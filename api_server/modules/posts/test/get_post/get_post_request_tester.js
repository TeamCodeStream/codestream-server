// handle unit tests for the "GET /posts/:id" request

'use strict';

const GetPostTest = require('./get_post_test');
const NotFoundTest = require('./not_found_test');
const ACLTest = require('./acl_test');
const GetPostWithMarkerTest = require('./get_post_with_marker_test');
const GetPostWithCodemarkTest = require('./get_post_with_codemark_test');
const GetPostWithReviewTest = require('./get_post_with_review_test');
const GetPostWithCodeErrorTest = require('./get_post_with_code_error_test');
const GetReplyToCodeErrorTest = require('./get_reply_to_code_error_test');
const GetOtherPostWithCodeErrorTest = require('./get_other_post_with_code_error_test');
const GetOtherReplyToCodeErrorTest = require('./get_other_reply_to_code_error_test');
const GetCodeErrorPostAclTest = require('./get_code_error_post_acl_test');
const GetCodeErrorReplyAclTest = require('./get_code_error_reply_acl_test');

class GetPostRequestTester {

	getPostTest () {
		new GetPostTest().test();
		new GetPostTest({ mine: true }).test();
		// Posting to streams other than the team-stream is no longer supported
		//new GetPostTest({type: 'channel', mine: true}).test();
		//new GetPostTest({type: 'direct', mine: true}).test();
		//new GetPostTest({type: 'channel'}).test();
		//new GetPostTest({type: 'direct'}).test();
		new NotFoundTest().test();
		new ACLTest().test();
		// Posting to streams other than the team-stream is no longer supported
		//new ACLTest({ type: 'direct' }).test();
		//new ACLTest({ type: 'channel' }).test();
		new GetPostWithCodemarkTest().test();
		new GetPostWithMarkerTest().test();
		new GetPostWithReviewTest().test();
		new GetPostWithCodeErrorTest().test();
		new GetReplyToCodeErrorTest().test();
		new GetOtherPostWithCodeErrorTest().test();
		new GetOtherReplyToCodeErrorTest().test();
		// TODO
		//new GetCodeErrorPostAclTest().test();
		//new GetCodeErrorReplyAclTest().test();
	}
}

module.exports = GetPostRequestTester;
