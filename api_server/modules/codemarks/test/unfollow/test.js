// handle unit tests for the "PUT /codemarks/unfollow/:id" request to unfollow a codemark

'use strict';

const UnfollowTest = require('./unfollow_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');
const CodemarkNotFoundTest = require('./codemark_not_found_test');
const ACLTeamTest = require('./acl_team_test');
const ACLStreamTest = require('./acl_stream_test');
const AlreadyNotFollowingTest = require('./already_not_following_test');

class FollowRequestTester {

	test () {
		new UnfollowTest().test();
		new FetchTest().test();
		new MessageTest({ isTeamStream: true }).test();
		new MessageTest({ streamType: 'channel' }).test();
		new MessageTest({ streamType: 'direct' }).test();
		new CodemarkNotFoundTest().test();
		new ACLTeamTest().test();
		new ACLStreamTest({ streamType: 'channel' }).test();
		new ACLStreamTest({ streamType: 'direct' }).test();
		new AlreadyNotFollowingTest().test();
	}
}

module.exports = new FollowRequestTester();
