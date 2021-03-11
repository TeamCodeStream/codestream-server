// handle unit tests for the "GET /no-auth/unfollow-link/:id" request to unfollow a codemark,
// from an email link

'use strict';

const UnfollowTest = require('./unfollow_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');
const CodemarkNotFoundTest = require('./codemark_not_found_test');
const ACLTeamTest = require('./acl_team_test');
//const ACLStreamTest = require('./acl_stream_test');
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
		// NOTE posting to streams other than the team stream is no longer allowed
		//new MessageTest({ isTeamStream: true }).test();
		//new MessageTest({ streamType: 'channel' }).test();
		//new MessageTest({ streamType: 'direct' }).test();
		new CodemarkNotFoundTest().test();
		new ACLTeamTest().test();
		//new ACLStreamTest({ streamType: 'channel' }).test();
		//new ACLStreamTest({ streamType: 'direct' }).test();
		new NoTokenTest().test();
		new TokenExpiredTest().test();
		new InvalidTokenTest().test();
		new NotUnfollowTokenTest().test();
		new UserNotFoundTest().test();
		new TrackingTest().test();
	}
}

module.exports = new FollowRequestTester();
