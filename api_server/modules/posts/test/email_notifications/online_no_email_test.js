'use strict';

var EmailNotificationTest = require('./email_notification_test');
var Assert = require('assert');

class OnlineNoEmailTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantRegisteredUser = true;	// we want a registered user to get the email (an unregistered user wouldn't be online)
		this.onlineForTeam = true;		// we want the user to be online for the team (they are subscribed to the team channel)
		this.onlineForRepo = true;		// we also want the user to be online for the repo (subscribed to the repo channel)
	}

	get description () {
		return 'a user who is online (subscribed to both the repo and the team channel) should not receive an email notification for a new post';
	}

	// called if message doesn't arrive after timeout, in this case, this is what we want
	messageTimeout () {
		this.messageCallback();
	}

	// called when a message has been received, in this case this is bad
	messageReceived (error, message) {
		if (error) { return this.messageCallback(error); }
		if (message.message && message.message.from && message.message.to) {
			Assert.fail('email message was received');
		}
	}

}

module.exports = OnlineNoEmailTest;
