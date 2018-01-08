'use strict';

var AlreadyOnTeamTest = require('./already_on_team_test');

class NotOnTeamTest extends AlreadyOnTeamTest {

	constructor (options) {
		super(options);
		this.testOptions.dontIncludeCurrentUser = true;
	}

	get description () {
		return 'should return an error when trying to add a repo to an existing team that the user is not a member of';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
		};
	}
}

module.exports = NotOnTeamTest;
