'use strict';

const PutTeamTest = require('./put_team_test');

class NoAddUsersTest extends PutTeamTest {

	get description () {
		return 'should return an error when trying to update a team with a $addToSet to the memberIds array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005'
		};
	}

	// before the test runs...
	makeTeamData (callback) {
		super.makeTeamData(() => {
			this.data.$addToSet = { memberIds: this.users[0].user._id };
			callback();
		});
	}
}

module.exports = NoAddUsersTest;
