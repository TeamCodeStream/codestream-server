'use strict';

var EmailNotificationTest = require('./email_notification_test');

class PreferOnTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantRegisteredUser = true;	// we want a registered user to get the email (an unregistered user wouldn't be online)
	}

	get description () {
		return 'a user who has email notifications turned on should get an email notification';
	}

	// get the preference to set for the user
	getPreference () {
		return {
			emailNotifications: 'on'
		};
	}
}

module.exports = PreferOnTest;
