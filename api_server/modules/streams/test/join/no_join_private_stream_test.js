'use strict';

const JoinTest = require('./join_test');

class NoJoinPrivateStreamTest extends JoinTest {

	get description () {
		return 'should return an error when trying to join a private channel stream';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'not allowed to join this channel'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.streamOptions.privacy = 'private';
			callback();
		});
	}
}

module.exports = NoJoinPrivateStreamTest;
