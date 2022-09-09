'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');
const RandomString = require('randomstring');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class EligibleJoinCompaniesTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		// remove this check when we have moved to ONE_USER_PER_ORG
		if (this.oneUserPerOrg) {
			return 'should return companies eligible for joining given an email in response to a cross-environment request';
		} else {
			return 'should return eligible companies matching a given domain in response to a cross-environment request';
		}
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

	// create companies that the current user is not a member of, but that they are
	// eligible to join via domain-based joining or code host joining
	createEligibleJoinCompanies (callback) {
		this.expectedEligibleJoinCompanies = [];
		BoundAsync.times(
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
					],
					codeHostJoining: [
						`github.com/${RandomString.generate(10)}`,
						`gitlab.com/${RandomString.generate(10)}`
					]
				},
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.expectedEligibleJoinCompanies.push({
					id: response.company.id,
					name: response.company.name,
					byDomain: domain.toLowerCase(),
					domainJoining: response.company.domainJoining,
					codeHostJoining: response.company.codeHostJoining,
					memberCount: 1
				});
				if (this.oneUserPerOrg) { // remove when we have fully moved to ONE_USER_PER_ORG
					this.path = '/xenv/eligible-join-companies?email=' + encodeURIComponent(email);
				} else {
					this.path = '/xenv/eligible-join-companies?domain=' + encodeURIComponent(domain);
				}
				this.apiRequestOptions = {
					headers: {
						'X-CS-Auth-Secret': this.apiConfig.environmentGroupSecrets.requestAuth
					}
				};
				callback();
			}
		);
	}

	// create companies that the confirming user has been invited to
	createCompaniesAndInvite (callback) {
		if (!this.oneUserPerOrg) { // remove when have fully moved to ONE_USER_PER_ORG
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
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.expectedEligibleJoinCompanies.push({
					id: response.company.id,
					name: response.company.name,
					domainJoining: [],
					codeHostJoining: [],
					byInvite: true,
					memberCount: 1
				});
				this.inviteUser(response.company.teamIds[0], callback);
			},
			{
				token: this.users[1].accessToken
			}
		);
	}
	
	// invite the user to company just created
	inviteUser (teamId, callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					teamId,
					email: this.currentUser.user.email
				},
				token: this.users[1].accessToken
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
