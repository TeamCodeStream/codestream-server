// handle unit tests for the "PUT /logout" request, to log a user out, effectively revoking their access token

'use strict';

const LogoutTest = require('./logout_test');
const MessageToUserTest = require('./message_to_user_test');

class LogoutRequestTester {

	test () {
 		new LogoutTest().test();
		new MessageToUserTest().test();
	}
}

module.exports = new LogoutRequestTester();
