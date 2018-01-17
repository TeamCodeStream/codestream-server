'use strict';

var EmailNotificationTest = require('./email_notification_test');
var Assert = require('assert');

/*
 * This is a base class to be used for other tests that will turn the email notification
 * off for the particular test
 */
class PreferenceOffTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantRegisteredUser = true;	// we want a registered user to get the email (an unregistered user wouldn't be online)
	}

	// called if message doesn't arrive after timeout, in this case, this is what we want
	messageTimeout () {
		this.messageCallback();
	}

	// called when a message has been received, in this case this is bad
	messageReceived (error, message) {
		if (error) { return this.messageCallback(error); }
		if (message.message && message.message.from) {
			Assert.fail('email message was received');
		}
	}

}

module.exports = PreferenceOffTest;
