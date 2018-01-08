'use strict';

var EmailNotificationTest = require('./email_notification_test');

class MentionFirstEmailTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantRegisteredUser = true;	// want a registered user to receive the email
		this.wantMention = true;		// want the user to be mentioned
	}

	get description () {
		return 'registered user mentioned in an email notification for the first time should receive the correct email';
	}
}

module.exports = MentionFirstEmailTest;
