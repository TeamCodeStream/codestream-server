'use strict';

const RemoveAdminTest = require('./remove_admin_test');

class AdminIdsNotArrayTest extends RemoveAdminTest {

	get description () {
		return 'should return an error when trying to update a team with a $pull to an adminIds attribute that is not a string or array';
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
			this.data.$pull.adminIds = 1;
			callback();
		});
	}
}

module.exports = AdminIdsNotArrayTest;
