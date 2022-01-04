'use strict';

const DeleteCompanyTest = require('./delete_company_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class NonOrphanedNotDeletedTest extends DeleteCompanyTest {

	get description () {
		return 'should not delete users in multiple teams';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return null;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before, // do the usual test prep
			this.createSecondCompany, // create a second company so users aren't orphaned
			this.deleteCompany, // perform the actual deletion
			this.overridePath // we care about the user, not the company
		], callback);
	}

	// we create a second company so that when we delete the first company,
	// our user isn't orphaned
	createSecondCompany (callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.secondTeam = response.team;
				this.secondCompany = response.company;
				this.secondTeamStream = response.streams[0];
				callback();
			},
			{
				token: this.token
			}
		);
	}

	overridePath (callback) {
		this.path = '/users/' + this.currentUser.user.id;
		callback();
	}

	// validate that the response is correct
	validateResponse (data) {
		const user = data.user;
		Assert(user, 'user does not exist');
		Assert(!user.teamIds.includes(this.team.id), 'user is still in deleted company');
	}
}

module.exports = NonOrphanedNotDeletedTest;

