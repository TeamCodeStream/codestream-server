// handle unit tests for the "GET /codemark" request to fetch a knowledge base codemark

'use strict';

const GetCodeMarkTest = require('./get_codemark_test');
const GetCodeMarkWithMarkerTest = require('./get_codemark_with_marker_test');
const GetPostlessCodeMarkTest = require('./get_postless_codemark_test');
const GetPostlessCodeMarkWithMarkerTest = require('./get_postless_codemark_with_marker_test');
const ACLTest = require('./acl_test');
const PostlessACLTest = require('./postless_acl_test');
const ACLTeamTest = require('./acl_team_test');

class GetCodeMarkRequestTester {

	test () {
		new GetCodeMarkTest().test();
		new GetCodeMarkWithMarkerTest().test();
		new GetPostlessCodeMarkTest().test();
		new GetPostlessCodeMarkWithMarkerTest().test();
		new ACLTest({ type: 'direct' }).test();
		new ACLTest({ type: 'channel' }).test();
		new PostlessACLTest().test();
		new ACLTeamTest({ type: 'direct' }).test();
		new ACLTeamTest({ type: 'channel' }).test();
	}
}

module.exports = new GetCodeMarkRequestTester();
