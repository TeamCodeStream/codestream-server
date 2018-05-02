'use strict';

const JoinTest = require('./join_test');

class NoJoinTeamStreamTest extends JoinTest {

	constructor (options) {
		super(options);
		this.isTeamStream = true;
	}
    
	get description () {
		return 'should return an error when trying to join a team stream';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'can not join a team stream'
		};
	}
}

module.exports = NoJoinTeamStreamTest;
