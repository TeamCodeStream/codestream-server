'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CompanyTestConstants = require('../company_test_constants');
const TestTeamCreator = require(process.env.CS_API_TOP + '/lib/test_base/test_team_creator');

class GetCompaniesTest extends CodeStreamAPITest {

	get description () {
		return 'should return companies i am a member of when requesting my companies';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createTeamWithMe,
			this.createTeamWithoutMe,
			this.setPath					
		], callback);
	}

	createTeamWithMe (callback) {
		new TestTeamCreator({
			test: this,
			teamOptions: {
				creatorToken: this.users[1].accessToken,
				members: [this.users[0].user.email]
			},
			userOptions: this.userOptions
		}).create((error, data) => {
			if (error) { return callback(error); }
			this.companyWithMe = data.company;
			callback();
		});
	}

	createTeamWithoutMe (callback) {
		new TestTeamCreator({
			test: this,
			teamOptions: {
				creatorToken: this.users[1].accessToken
			},
			userOptions: this.userOptions
		}).create((error, data) => {
			if (error) { return callback(error); }
			this.companyWithoutMe = data.company;
			callback();
		});
	}

	// set the path for the test
	setPath (callback) {
		this.path = '/companies?mine';
		callback();
	}

	// validate we got only companies i am in, meaning the company from the team i created,
	// and the other companies that were created with me as part of the team
	validateResponse (data) {
		let myCompanies = [this.company, this.companyWithMe];
		this.validateMatchingObjects(myCompanies, data.companies, 'companies');
		this.validateSanitizedObjects(data.companies, CompanyTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetCompaniesTest;
