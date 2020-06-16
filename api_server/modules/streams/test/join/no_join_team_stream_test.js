'use strict';

const JoinTest = require('./join_test');

class NoJoinTeamStreamTest extends JoinTest {

	get description () {
		return 'should return an error when trying to join a team stream';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'can not join a team stream'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.streamOptions.isTeamStream = true;
			callback();
		});
	}
}

module.exports = NoJoinTeamStreamTest;
