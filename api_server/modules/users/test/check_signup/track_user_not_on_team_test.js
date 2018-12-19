'use strict';

const TrackingTest = require('./tracking_test');

class TrackUserNotOnTeamTest extends TrackingTest {

	constructor (options) {
		super(options);
		this.dontCreateTeam = true; // suppress creating the team for the test, putting the user on no teams
		this.expectedError = 'User Not On Team';
	}

	get description () {
		return 'should send a Continue Into IDE Failed event for tracking purposes when a call is made to check signup status of a token and the user is not on the indicated team';
	}
}

module.exports = TrackUserNotOnTeamTest;
