'use strict';

const AddAdminTest = require('./add_admin_test');

class AddAdminIdsNotArrayTest extends AddAdminTest {

	get description () {
		return 'should return an error when trying to update a team with a $addToSet to an adminIds attribute that is not a string or array';
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
			this.data.$addToSet.adminIds = 1;
			callback();
		});
	}
}

module.exports = AddAdminIdsNotArrayTest;
