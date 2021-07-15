// handle unit tests for the "PUT /code-errors/follow/:id" request to follow a code error

'use strict';

const FollowTest = require('./follow_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');
const CodeErrorNotFoundTest = require('./code_error_not_found_test');
const ACLTeamTest = require('./acl_team_test');
const AlreadyFollowingTest = require('./already_following_test');

class FollowRequestTester {

	test () {
		new FollowTest().test();
		new FetchTest().test();
		new MessageTest().test();
		new CodeErrorNotFoundTest().test();
		new ACLTeamTest().test();
		new AlreadyFollowingTest().test();
	}
}

module.exports = new FollowRequestTester();
