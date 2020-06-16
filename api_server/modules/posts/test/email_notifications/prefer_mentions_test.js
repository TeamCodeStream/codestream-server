'use strict';

var EmailNotificationTest = require('./email_notification_test');

class PreferMentionsTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantRegisteredUser = true;	// we want a registered user to get the email (an unregistered user wouldn't be online)
		this.wantMention = true;	// user is mentioned in the post
	}

	get description () {
		return 'a user who has email notifications for mentions should get an email notification when they are mentioned';
	}

	// get the preference to set for the user
	getPreference () {
		return {
			emailNotifications: 'mentions'
		};
	}
}

module.exports = PreferMentionsTest;
