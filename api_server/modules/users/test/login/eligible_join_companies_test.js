'use strict';

const InitialDataTest = require('./initial_data_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class EligibleJoinCompaniesTest extends InitialDataTest {

	get description () {
		const oneUserPerOrg = this.oneUserPerOrg ? ', under one-user-per-org paradigm' : '';
		return `user should receive eligible companies to join via domain-based, code-host-based, and invite, when logging in${oneUserPerOrg}`;
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

		// in ONE_USER_PER_ORG, the confirming user is already in a company, which gets returned
		if (this.oneUserPerOrg) {
			this.expectedEligibleJoinCompanies.push({
				id: this.company.id,
				name: this.company.name,
				teamId: this.team.id,
				byInvite: true,
				memberCount: 2,
				accessToken: this.currentUser.accessToken
			});
		}

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
		const domain = this.data.email.split('@')[1];
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
		if (!this.oneUserPerOrg) { // remove this check when we are fully moved to ONE_USER_PER_ORG
			return callback();
		}

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
					email: this.data.email
				},
				token: this.currentCompanyToken
			},
			callback
		);
	}

	// accept the invite for one of the companies the user has been invited to
	acceptInvite (callback) {
		if (!this.oneUserPerOrg) { // remove when have fully moved to ONE_USER_PER_ORG
			return callback();
		}
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
