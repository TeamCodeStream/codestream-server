'use strict';

var EmailNotificationTest = require('./email_notification_test');

class MentionOngoingEmailTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantRegisteredUser = true;	// want a registered user to receive the email
		this.wantMention = true;		// want the user to be mentioned
		this.wantInitialPost = true;	// we want this to be an "ongoing" email, not the first email, so create a post before the post that triggers the email
	}

	get description () {
		return 'registered user mentioned in an email notification after the first time should receive the correct email';
	}
}

module.exports = MentionOngoingEmailTest;
