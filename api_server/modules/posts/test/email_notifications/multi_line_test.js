'use strict';

var EmailNotificationTest = require('./email_notification_test');

class MultiLineTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantMultiLine = true;
	}

	get description () {
		return 'email notification for post with multi-line text should have the linefeeds translated into html line breaks';
	}
}

module.exports = MultiLineTest;
