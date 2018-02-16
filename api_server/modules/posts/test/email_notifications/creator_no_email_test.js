'use strict';

var EmailNotificationTest = require('./email_notification_test');
var Assert = require('assert');

class CreatorNoEmailTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.creatorIsListener = true;	// make the post creator the listener for the email
	}

	get description () {
		return 'the creator of the post should not receive an email notification for it';
	}

	// called if message doesn't arrive after timeout, in this case, this is what we want
	messageTimeout () {
		this.messageCallback();
	}

	// called when a message has been received, in this case this is bad
	messageReceived (error, message) {
		if (error) { return this.messageCallback(error); }
		if (message.message.user) { return false; }	// ignore totalPosts update
		Assert.fail('message was received');
	}

}

module.exports = CreatorNoEmailTest;
