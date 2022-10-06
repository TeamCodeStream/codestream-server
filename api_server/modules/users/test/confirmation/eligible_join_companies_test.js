'use strict';

const InitialDataTest = require('./initial_data_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class EligibleJoinCompaniesTest extends InitialDataTest {

	get description () {
		const oneUserPerOrg = this.oneUserPerOrg ? ', in one-user-per-org paradigm' : '';
		return `user should receive eligible companies to join via domain-based and code-host-based with response to email confirmation${oneUserPerOrg}`;
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.createEligibleJoinCompanies(callback);
		});
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
				domainJoining: [],
				codeHostJoining: [],
				byInvite: true,
				memberCount: 2
			});
		}

		BoundAsync.times(
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
					],
					codeHostJoining: [
						`github.com/${RandomString.generate(10)}`,
						`gitlab.com/${RandomString.generate(10)}`
					]
				},
				token: this.users[0].accessToken
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
				callback();
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got the eligible companies in the response
		data.eligibleJoinCompanies.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		this.expectedEligibleJoinCompanies.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		Assert.deepStrictEqual(data.eligibleJoinCompanies, this.expectedEligibleJoinCompanies, 'eligibleJoinCompanies is not correct');
		super.validateResponse(data);
	}
}

module.exports = EligibleJoinCompaniesTest;
