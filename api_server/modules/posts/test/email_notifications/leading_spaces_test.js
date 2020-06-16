'use strict';

var EmailNotificationTest = require('./email_notification_test');

class LeadingSpacesTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantLeadingSpaces = true;
		this.wantMarker = true;
	}

	get description () {
		return 'email notification for post with lines with leading spaces should have the leading spaces translated into non-breaking spaces';
	}
}

module.exports = LeadingSpacesTest;
