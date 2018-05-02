'use strict';

const JoinTest = require('./join_test');

class NoJoinNonChannelStreamTest extends JoinTest {

	get description () {
		return `should return an error when trying to join a ${this.type} stream`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'only channel streams can be joined'
		};
	}
}

module.exports = NoJoinNonChannelStreamTest;
