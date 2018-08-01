'use strict';

const PutTeamTest = require('./put_team_test');

class NoPushUsersTest extends PutTeamTest {

	get description () {
		return 'should return an error when trying to update a team with a $push to the memberIds array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005'
		};
	}

	// before the test runs...
	makeTeamData (callback) {
		super.makeTeamData(() => {
			this.data.$push = { memberIds: this.otherUserData[0].user._id };
			callback();
		});
	}
}

module.exports = NoPushUsersTest;
