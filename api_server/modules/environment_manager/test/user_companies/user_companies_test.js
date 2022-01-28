'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class UserCompaniesTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'should return companies the user is a member of in response to a cross-environment request';
	}

	get method () {
		return 'get';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createCompanies,
			this.inviteUserToCompanies,
			this.setPath
		], callback);
	}

	// create companies that the current user will be a member of
	createCompanies (callback) {
		this.expectedCompanies = [];
		BoundAsync.times(
			this,
			2,
			this.createCompany,
			callback
		);
	}

	// create a company that the current user will be a member of
	createCompany (n, callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/companies',
				data: {
					name: this.companyFactory.randomName(),
				},
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.expectedCompanies.push(response.company);
				callback();
			}
		);
	}

	// invite the current user to the created companies
	inviteUserToCompanies (callback) {
		BoundAsync.times(
			this,
			2,
			this.inviteUserToCompany,
			callback
		);
	}

	// invite the current user to a created company
	inviteUserToCompany (n, callback) {
		const company = this.expectedCompanies[n];
		const teamId = company.everyoneTeamId;
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: this.currentUser.user.email,
					teamId
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}

	setPath (callback) {
		this.path = '/xenv/user-companies?email=' + encodeURIComponent(this.currentUser.user.email);
		this.apiRequestOptions = {
			headers: {
				'X-CS-Auth-Secret': this.apiConfig.sharedSecrets.auth
			}
		};
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got the eligible companies in the response
		data.companies.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		this.expectedCompanies.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		Assert.deepStrictEqual(data.companies, this.expectedCompanies, 'returned companies are not correct');
	}
}

module.exports = UserCompaniesTest;
