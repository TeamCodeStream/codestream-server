'use strict';

var EmailNotificationTest = require('./email_notification_test');

class MentionUnregisteredOngoingEmailTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantMention = true;		// want the user to be mentioned
		this.wantInitialPost = true;	// we want this to be an "ongoing" email, not the first email, so create a post before the post that triggers the email
	}

	get description () {
		return 'unregistered user mentioned in an email notification after the first time should receive the correct email';
	}
}

module.exports = MentionUnregisteredOngoingEmailTest;
