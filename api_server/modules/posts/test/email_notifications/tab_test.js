'use strict';

var EmailNotificationTest = require('./email_notification_test');

class MultiLineTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantTabs = true;
		this.wantMarker = true;
	}

	get description () {
		return 'email notification for post with tabs should have the tabs translated into non-breaking spaces';
	}
}

module.exports = MultiLineTest;
