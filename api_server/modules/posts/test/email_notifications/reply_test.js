'use strict';

var EmailNotificationTest = require('./email_notification_test');

class ReplyTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantRegisteredUser = true;	// we want a registered user to get the email
		this.wantParentPost = true;	// we want a parent post, the test post will be a reply to this one
	}

	get description () {
		return 'email notification for a post that is a reply to another post should have reply to text displayed';
	}
}

module.exports = ReplyTest;
