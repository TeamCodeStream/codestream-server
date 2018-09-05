'use strict';

const ReactTest = require('./react_test');

class ACLTeamTest extends ReactTest {

	constructor (options) {
		super(options);
		this.withoutUserOnTeam = true;
		this.useTeamStream = true;
	}

	get description () {
		return 'should return an error when trying to react to a post in a team stream for a team i am not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLTeamTest;
