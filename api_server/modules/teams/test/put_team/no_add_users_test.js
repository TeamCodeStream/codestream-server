'use strict';

const PutTeamTest = require('./put_team_test');

class NoAddUsersTest extends PutTeamTest {

	get description () {
		return 'should return an error when trying to update a team with a $pull from the removedMemberIds array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005'
		};
	}

	// before the test runs...
	makeTeamData (callback) {
		super.makeTeamData(() => {
			this.data.$pull = { removedMemberIds: this.users[0].user.id };
			callback();
		});
	}
}

module.exports = NoAddUsersTest;
