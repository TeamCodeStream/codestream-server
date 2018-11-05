'use strict';

var EmailNotificationTest = require('./email_notification_test');

class MarkerTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantMarker = true;
	}

	get description () {
		return 'email notification for post with marker should display the marker';
	}
}

module.exports = MarkerTest;
