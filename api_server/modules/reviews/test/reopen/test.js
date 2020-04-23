// handle unit tests for the "PUT /reviews/follow/:id" request to follow a review

'use strict';

const ReopenTest = require('./reopen_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');
const ReviewNotFoundTest = require('./review_not_found_test');
const ACLTeamTest = require('./acl_team_test');
const ACLStreamTest = require('./acl_stream_test');

class RejectRequestTester {

	test () {
		new ReopenTest().test();
		new FetchTest().test();
		new MessageTest({ isTeamStream: true }).test();
		new MessageTest({ streamType: 'channel' }).test();
		new MessageTest({ streamType: 'direct' }).test();
		new ReviewNotFoundTest().test();
		new ACLTeamTest().test();
		new ACLStreamTest({ streamType: 'channel' }).test();
		new ACLStreamTest({ streamType: 'direct' }).test();
	}
}

module.exports = new RejectRequestTester();
