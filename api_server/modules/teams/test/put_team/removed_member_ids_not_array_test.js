'use strict';

const RemoveUserTest = require('./remove_user_test');

class RemovedMemberIdsNotArrayTest extends RemoveUserTest {

	get description () {
		return 'should return an error when trying to update a team with an $addToSet to a removedMemberIds attribute that is not a string or array';
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
			this.data.$addToSet.removedMemberIds = 1;
			callback();
		});
	}
}

module.exports = RemovedMemberIdsNotArrayTest;
