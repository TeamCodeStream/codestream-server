'use strict';

const JoinTest = require('./join_test');

class JoinStreamDeprecatedTest extends JoinTest {

	get description () {
		return `should return error when attempting to join a stream, support is deprecated`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1016'
		};
	}
}

module.exports = JoinStreamDeprecatedTest;
