'use strict';

const TrackingTest = require('./tracking_test');

class TrackUserNotRegisteredTest extends TrackingTest {

	constructor (options) {
		super(options);
		this.dontConfirm = true;	// don't confirm registration
		this.dontCreateTeam = true; // suppress creating the team for the test
		this.expectedError = 'Email Not Confirmed';
		this.cheatOnSubscription = true;
	}

	get description () {
		return 'should send a Continue Into IDE Failed event for tracking purposes when a call is made to check signup status of an expired token';
	}

	registerUser (callback) {
		super.registerUser(error => {
			if (error) { return callback(error); }
			this.currentUser.broadcasterToken = this.currentUser.user.id;
			callback();
		});
	}
}

module.exports = TrackUserNotRegisteredTest;
