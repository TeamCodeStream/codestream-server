'use strict';

const ReactTest = require('./react_test');

class ACLTeamTest extends ReactTest {

	get description () {
		return 'should return an error when trying to react to a post in a team stream for a team i am not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.creatorIndex = 1;
			this.teamOptions.members = [];
			this.streamOptions.members = [];
			this.postOptions.creatorIndex = 1;
			callback();
		});
	}
}

module.exports = ACLTeamTest;
