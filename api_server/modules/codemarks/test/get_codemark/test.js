// handle unit tests for the "GET /codemark" request to fetch a knowledge base codemark

'use strict';

const GetCodemarkTest = require('./get_codemark_test');
const GetCodemarkWithMarkerTest = require('./get_codemark_with_marker_test');
const GetPostlessCodemarkTest = require('./get_postless_codemark_test');
const GetPostlessCodemarkWithMarkerTest = require('./get_postless_codemark_with_marker_test');
const ACLTest = require('./acl_test');
const PostlessACLTest = require('./postless_acl_test');
const ACLTeamTest = require('./acl_team_test');

class GetCodemarkRequestTester {

	test () {
		new GetCodemarkTest().test();
		new GetCodemarkWithMarkerTest().test();
		new GetPostlessCodemarkTest().test();
		new GetPostlessCodemarkWithMarkerTest().test();
		new ACLTest({ type: 'direct' }).test();
		new ACLTest({ type: 'channel' }).test();
		new PostlessACLTest().test();
		new ACLTeamTest({ type: 'direct' }).test();
		new ACLTeamTest({ type: 'channel' }).test();
	}
}

module.exports = new GetCodemarkRequestTester();
