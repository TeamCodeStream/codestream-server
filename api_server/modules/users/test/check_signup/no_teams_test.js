'use strict';

const CheckSignupTest = require('./check_signup_test');

class NoTeamsTest extends CheckSignupTest {

	constructor (options) {
		super(options);
		this.dontCreateTeam = true; // suppress creating the team for the test, putting the user on no teams
	}

	get description () {
		return 'should return an error when sending a check signup request for a user that is not on any teams';
	}

	getExpectedError () {
		return {
			code: 'USRC-1012'
		};
	}
}

module.exports = NoTeamsTest;
