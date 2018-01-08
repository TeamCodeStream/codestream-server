'use strict';

var EmailNotificationTest = require('./email_notification_test');

class OfflineForRepoTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantRegisteredUser = true;	// we want a registered user to get the email (an unregistered user wouldn't be online)
		this.onlineForTeam = true;		// we want the user to be online for the team (they are subscribed to the team channel), but not for the repo
	}

	get description () {
		return 'registered user who is online for the team but not for the repo should receive the correct email notification';
	}
}

module.exports = OfflineForRepoTest;
