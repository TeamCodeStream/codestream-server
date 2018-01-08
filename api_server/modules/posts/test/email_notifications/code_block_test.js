'use strict';

var EmailNotificationTest = require('./email_notification_test');

class CodeBlockTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantCodeBlock = true;
	}

	get description () {
		return 'email notification for post with code block should display the code block';
	}
}

module.exports = CodeBlockTest;
