'use strict';

const CheckSignupTest = require('./check_signup_test');

class NoTeamsTest extends CheckSignupTest {

	constructor (options) {
		super(options);
		this.dontCreateTeam = true; // suppress creating the team for the test, putting the user on no teams
	}

	get description () {
		return 'should be ok to issue a check signup request for a user that is not on any teams';
	}
}

module.exports = NoTeamsTest;
