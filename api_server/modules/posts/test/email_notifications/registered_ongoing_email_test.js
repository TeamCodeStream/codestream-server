'use strict';

var EmailNotificationTest = require('./email_notification_test');

class RegisteredOngoingEmailTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantRegisteredUser = true;	// we want a registered user to get the email (an unregistered user wouldn't be online)
		this.wantInitialPost = true;	// we want this to be an "ongoing" email, not the first email, so create a post before the post that triggers the email
	}

	get description () {
		return 'registered user receiving an email notification after the first time should receive the correct email';
	}
}

module.exports = RegisteredOngoingEmailTest;
