'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class EligibleJoinCompaniesTest extends CodeStreamAPITest {

	get description () {
		return 'should return companies eligible for joining given an email in response to a cross-environment request';
	}

	get method () {
		return 'get';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createEligibleJoinCompanies,
			this.createCompaniesAndInvite,
			this.acceptInvite
		], callback);
	}

	// create companies that the confirming user is not a member of, but that they are
	// eligible to join via domain-based joining or code host joining
	createEligibleJoinCompanies (callback) {
		this.expectedEligibleJoinCompanies = [];

		// in one-user-per-org, the confirming user is already in a company, which gets returned
		this.expectedEligibleJoinCompanies.push({
			id: this.company.id,
			name: this.company.name,
			teamId: this.team.id,
			byInvite: true,
			memberCount: 2,
			accessToken: this.currentUser.accessToken
		});

		BoundAsync.timesSeries(
			this,
			2,
			this.createEligibleJoinCompany,
			callback
		);
	}

	// create a company that the current user is not a member of, but that they are
	// eligible to join via domain-based joining or code host joining
	createEligibleJoinCompany (n, callback) {
		const email = this.currentUser.user.email;
		const domain = email.split('@')[1];
		this.doApiRequest(
			{
				method: 'post',
				path: '/companies',
				data: {
					name: this.companyFactory.randomName(),
					domainJoining: [
						this.companyFactory.randomDomain(),
						domain
					]
				},
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.path = '/xenv/eligible-join-companies?email=' + encodeURIComponent(email);
				this.apiRequestOptions = {
					headers: {
						'X-CS-Auth-Secret': this.apiConfig.environmentGroupSecrets.requestAuth
					}
				};
				if (response.accessToken) {
					this.getEligibleJoinCompanyByLogin(response.accessToken, domain, callback);
				} else {
					this.expectedEligibleJoinCompanies.push({
						id: response.company.id,
						name: response.company.name,
						teamId: response.company.everyoneTeamId,
						byDomain: domain.toLowerCase(),
						domainJoining: response.company.domainJoining,
						memberCount: 1
					});
					callback();
				}
			}
		);
	}

	// a user who creates a second company gets an access token instead of full company info,
	// we must use that access token to actually get the company info
	getEligibleJoinCompanyByLogin (token, domain, callback) {
		this.doApiRequest({
			method: 'put',
			path: '/login',
			token
		}, (error, response) => {
			if (error) { return callback(error); }
			const company = response.companies[0];
			this.expectedEligibleJoinCompanies.push({
				id: company.id,
				name: company.name,
				teamId: company.everyoneTeamId,
				byDomain: domain.toLowerCase(),
				domainJoining: company.domainJoining,
				memberCount: 1
			});
			callback();
		});
	}

	// create companies that the confirming user has been invited to
	createCompaniesAndInvite (callback) {
		BoundAsync.timesSeries(
			this,
			2,
			this.createCompanyAndInvite,
			callback
		);
	}

	// create a company and then invite the confirming user to it
	createCompanyAndInvite (n, callback) {
		BoundAsync.series(this, [
			this.createCompany,
			this.doLogin,
			this.inviteUser
		], callback);
	}

	// create a company
	createCompany (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/companies',
				data: { name: this.companyFactory.randomName() },
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.currentCompanyToken = response.accessToken;
				callback();
			}
		);
	}

	// do a login for a particular company based on the access token passed when creating it
	doLogin (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/login',
				token: this.currentCompanyToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				const company = response.companies[0];
				this.expectedEligibleJoinCompanies.push({
					id: company.id,
					name: company.name,
					teamId: company.everyoneTeamId,
					byInvite: true,
					memberCount: 1
				});
				this.currentCompanyTeamId = response.teams[0].id;
				callback();
			}
		);
	}

	// invite the user to company just created
	inviteUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					teamId: this.currentCompanyTeamId,
					email: this.currentUser.user.email
				},
				token: this.currentCompanyToken
			},
			callback
		);
	}

	// accept the invite for one of the companies the user has been invited to
	acceptInvite (callback) {
		const companyInfo = this.expectedEligibleJoinCompanies[this.expectedEligibleJoinCompanies.length - 1];
		companyInfo.memberCount++;
		this.doApiRequest(
			{
				method: 'put',
				path: '/join-company/' + companyInfo.id,
				token: this.currentUser.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				companyInfo.accessToken = response.accessToken;
				callback();
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got the eligible companies in the response
		data.companies.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		this.expectedEligibleJoinCompanies.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		Assert.deepStrictEqual(data.companies, this.expectedEligibleJoinCompanies, 'eligibleJoinCompanies is not correct');
	}
}

module.exports = EligibleJoinCompaniesTest;
