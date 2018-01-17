'use strict';

var EmailNotificationTest = require('./email_notification_test');

class PreferStreamMentionsTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantRegisteredUser = true;	// we want a registered user to get the email (an unregistered user wouldn't be online)
		this.wantMention = true;	// user is mentioned in the post
	}

	get description () {
		return 'a user who has email notifications turned to mentions for a specific stream but off generally should get an email notification when they are mentioned';
	}

	// get the preference to set for the user
	getPreference () {
		return {
			general: 'off',
			[this.stream._id]: 'mentions'
		};
	}
}

module.exports = PreferStreamMentionsTest;
