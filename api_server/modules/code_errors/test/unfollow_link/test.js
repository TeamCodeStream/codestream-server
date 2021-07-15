// handle unit tests for the "GET /no-auth/unfollow-link/code-error/:id" request to unfollow a code error,
// from an email link

'use strict';

const UnfollowTest = require('./unfollow_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');
const CodeErrorNotFoundTest = require('./code_error_not_found_test');
const ACLTeamTest = require('./acl_team_test');
const NoTokenTest = require('./no_token_test');
const TokenExpiredTest = require('./token_expired_test');
const InvalidTokenTest = require('./invalid_token_test');
const NotUnfollowTokenTest = require('./not_unfollow_token_test');
const UserNotFoundTest = require('./user_not_found_test');
const TrackingTest = require('./tracking_test');

class FollowRequestTester {

	test () {
		new UnfollowTest().test();
		new FetchTest().test();
		new MessageTest().test();
		new CodeErrorNotFoundTest().test();
		new ACLTeamTest().test();
		new NoTokenTest().test();
		new TokenExpiredTest().test();
		new InvalidTokenTest().test();
		new NotUnfollowTokenTest().test();
		new UserNotFoundTest().test();
		new TrackingTest().test();
	}
}

module.exports = new FollowRequestTester();
