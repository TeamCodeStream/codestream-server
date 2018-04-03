'use strict';

const TrackingTest = require('./tracking_test');

class TrackingAlreadyInvitedTest extends TrackingTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
	}

	get description () {
		return 'should send a Team Member Invited event with First Invite set to false when a user is invited a second time';
	}

	// form the data for the user update
	makeData (callback) {
		this.subsequentInvite = true;
		// invite the user once before the actual test
		super.makeData(error => {
			if (error) { return callback(error); }
			this.generateMessage(callback);
		});
	}
}

module.exports = TrackingAlreadyInvitedTest;
