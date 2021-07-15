// handle unit tests for the "PUT /code-error/unfollow/:id" request to unfollow a code error

'use strict';

const UnfollowTest = require('./unfollow_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');
const CodeErrorNotFoundTest = require('./code_error_not_found_test');
const ACLTeamTest = require('./acl_team_test');
const AlreadyNotFollowingTest = require('./already_not_following_test');

class FollowRequestTester {

	test () {
		new UnfollowTest().test();
		new FetchTest().test();
		new MessageTest().test();
		new CodeErrorNotFoundTest().test();
		new ACLTeamTest().test();
		new AlreadyNotFollowingTest().test();
	}
}

module.exports = new FollowRequestTester();
