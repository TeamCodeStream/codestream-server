'use strict';

var EmailNotificationTest = require('./email_notification_test');

class PreferOnForStreamTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantRegisteredUser = true;	// we want a registered user to get the email (an unregistered user wouldn't be online)
	}

	get description () {
		return 'a user who has email notifications turned on for a specific stream but off by default should get an email notification';
	}

	// get the preference to set for the user
	getPreference () {
		return {
			default: 'off',
			[this.stream._id]: 'on'
		};
	}
}

module.exports = PreferOnForStreamTest;
