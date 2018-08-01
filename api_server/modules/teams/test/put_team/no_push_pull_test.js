'use strict';

const RemoveAdminsTest = require('./remove_admins_test');

class NoPushPullTest extends RemoveAdminsTest {

	get description () {
		return 'should return an error when trying to update a team with a $push and a $pull to the adminIds array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005'
		};
	}

	// before the test runs...
	makeTeamData (callback) {
		super.makeTeamData(() => {
			this.data.$push = { adminIds: this.data.$pull.adminIds[0] };
			callback();
		});
	}
}

module.exports = NoPushPullTest;
