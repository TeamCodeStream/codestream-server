'use strict';

const TrackingTest = require('./tracking_test');

class TrackingRegisteredTest extends TrackingTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
		this.existingUserIsRegistered = true;
	}

	get description () {
		return 'should send a Team Member Invited event with Registered set to true when a registered user is invited';
	}
}

module.exports = TrackingRegisteredTest;
