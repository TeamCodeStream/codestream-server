// handle unit tests for the "GET /no-auth/unsubscribe-weekly" request for a user to unsubscribe 
// from weekly emails, from an email link

'use strict';

const UnsubscribeTest = require('./unsubscribe_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');
const UserNotFoundTest = require('./user_not_found_test');
const NoTokenTest = require('./no_token_test');
const InvalidTokenTest = require('./invalid_token_test');
const NotUnsubscribeTokenTest = require('./not_unsubscribe_token_test');
const TrackingTest = require('./tracking_test');

class UnsubscribeRequestTester {

	test () {
		new UnsubscribeTest().test();
		new FetchTest().test();
		new MessageTest().test();
		new UserNotFoundTest().test();
		new NoTokenTest().test();
		new InvalidTokenTest().test();
		new NotUnsubscribeTokenTest().test();
		new TrackingTest().test();
	}
}

module.exports = new UnsubscribeRequestTester();
