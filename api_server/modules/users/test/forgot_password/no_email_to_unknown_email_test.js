'use strict';

var ResetPasswordEmailTest = require('./reset_password_email_test');
const Assert = require('assert');

class NoEmailToUnknownEmailTest extends ResetPasswordEmailTest {

	get description () {
		return 'should not send a reset password email when handling a reset password request for an unknown email';
	}

	// make the data that will be used during the test request
	makeRequestData () {
		// substitute a random email
		const data = super.makeRequestData();
		data.email = this.userFactory.randomEmail();
		return data;
	}

	// called if message doesn't arrive after timeout, in this case, this is what we want
	messageTimeout () {
		this.messageCallback();
	}

	// called when a message has been received, in this case this is bad
	messageReceived (error) {
		if (error) { return this.messageCallback(error); }
		Assert.fail('email message was received');
	}
}

module.exports = NoEmailToUnknownEmailTest;
