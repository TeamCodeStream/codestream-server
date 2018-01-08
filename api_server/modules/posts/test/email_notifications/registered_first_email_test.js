'use strict';

var EmailNotificationTest = require('./email_notification_test');

class RegisteredFirstEmailTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantRegisteredUser = true;	// we want a registered user to get the email (an unregistered user wouldn't be online)
	}

	get description () {
		return 'registered user receiving an email notification for the first time should receive the correct email';
	}
}

module.exports = RegisteredFirstEmailTest;
