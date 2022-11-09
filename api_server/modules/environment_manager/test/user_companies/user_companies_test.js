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
			this.acceptInvites,
			this.setPath
		], callback);
	}

	// create companies that the current user will be a member of
	createCompanies (callback) {
		this.expectedCompanies = [];
		this.companyTokens = [];
		BoundAsync.times(
			this,
			2,
			this.createCompany,
			callback
		);
	}

	// create a company that the current user will be a member of
	createCompany (n, callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				if (response.accessToken) {
					this.companyTokens.push(response.accessToken);
				} else {
					this.companyTokens.push(this.users[1].accessToken);
				}
				this.expectedCompanies.push(response.company);
				callback();
			}, { token: this.users[1].accessToken }
		);
	}

	// invite the current user to the created companies
	inviteUserToCompanies (callback) {
		BoundAsync.timesSeries(
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
				token: this.companyTokens[n]
			},
			callback
		);
	}

	// accept the invite of the current user to the created companies
	acceptInvites (callback) {
		BoundAsync.timesSeries(
			this,
			2,
			this.acceptInvite,
			callback
		);
	}

	// accept the invite of the current user to a created company
	acceptInvite (n, callback) {
		const company = this.expectedCompanies[n];
		this.doApiRequest(
			{
				method: 'put',
				path: '/join-company/' + company.id,
				token: this.users[0].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				if (n === 0) {
					// because original user gets deactivated
					this.token = this.users[0].accessToken = response.accessToken;
				}
				this.expectedCompanies[n].accessToken = response.accessToken;
				callback();
			}
		);
	}

	setPath (callback) {
		this.path = '/xenv/user-companies?email=' + encodeURIComponent(this.currentUser.user.email);
		this.apiRequestOptions = {
			headers: {
				'X-CS-Auth-Secret': this.apiConfig.environmentGroupSecrets.requestAuth
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
