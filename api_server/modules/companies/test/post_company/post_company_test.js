// provide a base class for many of the tests of the "POST /companies" request to create a company
'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CompanyTestConstants = require('../company_test_constants');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const TeamTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/test/team_test_constants');

class PostCompanyTest extends CodeStreamAPITest {

	get method () {
		return 'post';
	}

	get path () {
		return '/companies';
	}

	get description () {
		return 'should return a valid company when creating a new company';
	}

	getExpectedFields () {
		return CompanyTestConstants.EXPECTED_COMPANY_RESPONSE;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.makeCompanyData
		], callback);
	}

	// make the data to use when issuing the request
	makeCompanyData (callback) {
		this.data = {
			name: this.companyFactory.randomName()
		};
		callback();
	}

	/* eslint complexity: 0 */
	// validate the response to the test request
	validateResponse (data) {
		const company = data.company;
		const team = data.team;
		const errors = [];
		const result = (
			((company.id === company._id) || errors.push('id not set to _id')) && 	// DEPRECATE ME
			((company.name === this.data.name) || errors.push('name does not match')) &&
			((company.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof company.createdAt === 'number') || errors.push('createdAt not number')) &&
			((company.modifiedAt >= company.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((company.creatorId === this.currentUser.user.id) || errors.push('creatorId not equal to current user id')) &&
			((team.id === team._id) || errors.push('team.id not set to team._id')) && // DEPRECATE ME
			((team.name === 'Everyone') || errors.push('team name not set to "Everyone"')) &&
			((team.isEveryoneTeam === true) || errors.push('team isEveryoneFlag not set')) &&
			((team.companyId === company.id) || errors.push('team companyId should be set to the company id'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		Assert.deepStrictEqual(company.teamIds, [team.id], 'teamIds should have single "Everyone" team');
		this.validateSanitized(company, CompanyTestConstants.UNSANITIZED_ATTRIBUTES);
		this.validateSanitized(team, TeamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = PostCompanyTest;
