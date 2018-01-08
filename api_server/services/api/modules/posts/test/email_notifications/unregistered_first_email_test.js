'use strict';

var EmailNotificationTest = require('./email_notification_test');

class UnregisteredFirstEmailTest extends EmailNotificationTest {

	get description () {
		return 'unregistered user receiving an email notification for the first time should receive the correct email';
	}
}

module.exports = UnregisteredFirstEmailTest;
