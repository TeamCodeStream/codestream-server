'use strict';

const JoinTest = require('./join_test');

class NoJoinPrivateStreamTest extends JoinTest {

	constructor (options) {
		super(options);
		this.streamPrivacy = 'private';
	}

	get description () {
		return 'should return an error when trying to join a private channel stream';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'not allowed to join this channel'
		};
	}
}

module.exports = NoJoinPrivateStreamTest;
