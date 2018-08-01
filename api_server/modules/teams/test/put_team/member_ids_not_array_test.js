'use strict';

const RemoveUserTest = require('./remove_user_test');

class MemberIdsNotArrayTest extends RemoveUserTest {

	get description () {
		return 'should return an error when trying to update a team with a $pull to a memberIds attribute that is not a string or array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005'
		};
	}

	// before the test runs...
	makeTeamData (callback) {
		// substitute bogus memberIds value
		super.makeTeamData(() => {
			this.data.$pull.memberIds = 1;
			callback();
		});
	}
}

module.exports = MemberIdsNotArrayTest;
