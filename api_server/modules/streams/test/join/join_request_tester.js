// handle unit tests for the "PUT /join/:id" request

'use strict';

const JoinTest = require('./join_test');
const JoinFetchTest = require('./join_fetch_test');
const StreamNotFoundTest = require('./stream_not_found_test');
const NoJoinPrivateStreamTest = require('./no_join_private_stream_test');
const NoJoinNonChannelStreamTest = require('./no_join_non_channel_stream_test');
const NoJoinTeamStreamTest = require('./no_join_team_stream_test');
const ACLTeamTest = require('./acl_team_test');
const MessageToTeamTest = require('./message_to_team_test');
//const SubscriptionTest = require('./subscription_test');

class JoinRequestTester {

	joinTest () {
		/*
		TODO - this all needs to be revisited in the context on one and only one team stream
		new JoinTest().test();
		new JoinFetchTest().test();
		new StreamNotFoundTest().test();
		new NoJoinPrivateStreamTest().test();
		new NoJoinNonChannelStreamTest({ type: 'direct' }).test();
		new NoJoinNonChannelStreamTest({ type: 'file' }).test();
		new NoJoinTeamStreamTest().test();
		new ACLTeamTest().test();
		new MessageToTeamTest().test();
		// new SubscriptionTest().test(); // subscribing to stream channels is deprecated
		*/
	}
}

module.exports = JoinRequestTester;
