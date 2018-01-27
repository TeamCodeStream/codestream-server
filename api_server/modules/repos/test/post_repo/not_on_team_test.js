'use strict';

var AlreadyOnTeamTest = require('./already_on_team_test');

class NotOnTeamTest extends AlreadyOnTeamTest {

	constructor (options) {
		super(options);
		// don't include the current user when creating the original team, the user then shouldn't 
		// be able to create a repo in the team
		this.testOptions.dontIncludeCurrentUser = true;	
	}

	get description () {
		return 'should return an error when trying to add a repo to an existing team that the user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
		};
	}
}

module.exports = NotOnTeamTest;
