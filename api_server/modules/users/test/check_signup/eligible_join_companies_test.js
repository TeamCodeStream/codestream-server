'use strict';

const CheckSignupTest = require('./check_signup_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class EligibleJoinCompaniesTest extends CheckSignupTest {

	get description () {
		return `user should receive eligible companies to join via domain-based and invite, with response to check signup, under one-user-per-org paradigm`;
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 2;
			callback();
		});
	}

	doProviderAuth (callback) {
		// do these other things before initiating the auth process
		this.mockEmail = this.currentUser.user.email;  // identify auth process with the existing user
		BoundAsync.series(this, [
			this.createEligibleJoinCompanies,
			this.createCompaniesAndInvite,
			this.acceptInvite,
			super.doProviderAuth
		], callback);
	}

	// get parameter to use in the provider-auth request that kicks the authentication off
	// here we will actually simulate the process, not actually redirecting to the third-party
	// provider's permissions page
	getProviderAuthParameters () {
		// we're not actually doing a simulated sign-up in this case, but a simulated sign IN
		// (a signup will now fail, per NR-123475)
		const params = super.getProviderAuthParameters();
		params.noSignup = true;
		return params;
	}

	// create companies that the confirming user is not a member of, but that they are
	// eligible to join via domain-based joining or code host joining
	createEligibleJoinCompanies (callback) {
		this.expectedEligibleJoinCompanies = [];
		BoundAsync.timesSeries(
			this,
			2,
			this.createEligibleJoinCompany,
			callback
		);
	}

	// create a company that the confirming user is not a member of, but that they are
	// eligible to join via domain-based joining or code host joining
	createEligibleJoinCompany (n, callback) {
		const domain = this.currentUser.user.email.split('@')[1];
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
					teamId: company.everyoneTeamId,
					name: company.name,
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
		data.user.eligibleJoinCompanies.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		this.expectedEligibleJoinCompanies.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		Assert.deepStrictEqual(data.user.eligibleJoinCompanies, this.expectedEligibleJoinCompanies, 'eligibleJoinCompanies is not correct');
		super.validateResponse(data);
	}
}

module.exports = EligibleJoinCompaniesTest;
