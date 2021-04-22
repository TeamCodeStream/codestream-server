// handle unit tests for the "PUT /reviews/follow/:id" request to follow a review

'use strict';

const ReopenTest = require('./reopen_test');
const ReopenAfterRejectTest = require('./reopen_after_reject_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');
const ReviewNotFoundTest = require('./review_not_found_test');
const ACLTeamTest = require('./acl_team_test');
//const ACLStreamTest = require('./acl_stream_test');

class RejectRequestTester {

	test () {
		new ReopenTest().test();
		new ReopenAfterRejectTest().test();
		new FetchTest().test();
		new MessageTest().test();
		// NOTE - posting to streams other than the team stream is no longer allowed
		//new MessageTest({ isTeamStream: true }).test();
		//new MessageTest({ streamType: 'channel' }).test();
		//new MessageTest({ streamType: 'direct' }).test();
		new ReviewNotFoundTest().test();
		new ACLTeamTest().test();
		//new ACLStreamTest({ streamType: 'channel' }).test();
		//new ACLStreamTest({ streamType: 'direct' }).test();
	}
}

module.exports = new RejectRequestTester();
