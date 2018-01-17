'use strict';

var EmailNotificationTest = require('./email_notification_test');

class PreferGeneralOnTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantRegisteredUser = true;	// we want a registered user to get the email (an unregistered user wouldn't be online)
		this.wantMention = true;	// user is mentioned in the post
	}

	get description () {
		return 'a user who has email notifications turned on generally should get an email notification';
	}

	// get the preference to set for the user
	getPreference () {
		return {
			general: 'on'
		};
	}
}

module.exports = PreferGeneralOnTest;
