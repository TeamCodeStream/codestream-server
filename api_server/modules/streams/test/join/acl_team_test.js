'use strict';

const JoinTest = require('./join_test');

class ACLTeamTest extends JoinTest {

	get description () {
		return 'should return an error when someone who is not on the team tries to join a stream in that team';
	}
    
	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'can not join this stream'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [];
			callback();
		});
	}
}

module.exports = ACLTeamTest;
