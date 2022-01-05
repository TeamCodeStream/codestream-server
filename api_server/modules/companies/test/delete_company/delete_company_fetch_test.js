'use strict';

const DeleteCompanyTest = require('./delete_company_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class DeleteCompanyFetchTest extends DeleteCompanyTest {

	get description () {
		return 'should properly deactivate a company when deleted, checked by fetching the company';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before, // do the usual test prep
			this.createSecondCompany, // prevent user from getting deleted
			this.deleteCompany // perform the actual deletion
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
}

module.exports = DeleteCompanyFetchTest;

