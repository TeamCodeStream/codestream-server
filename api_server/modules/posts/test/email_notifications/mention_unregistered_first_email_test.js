'use strict';

var EmailNotificationTest = require('./email_notification_test');

class MentionUnregisteredFirstEmailTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantMention = true;		// want the user to be mentioned
	}

	get description () {
		return 'unregistered user mentioned in an email notification for the first time should receive the correct email';
	}
}

module.exports = MentionUnregisteredFirstEmailTest;
