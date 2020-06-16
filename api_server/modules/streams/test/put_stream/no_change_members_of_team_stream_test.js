'use strict';

const AddUserTest = require('./add_user_test');

class NoChangeMembersOfTeamStreamTest extends AddUserTest {

	get description () {
		return 'should return an error when trying to change the membership of a team-stream';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'can not change membership of a team stream'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.streamOptions.isTeamStream = true;
			callback();
		});
	}
}

module.exports = NoChangeMembersOfTeamStreamTest;
