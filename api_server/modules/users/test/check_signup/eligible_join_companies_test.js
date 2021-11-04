'use strict';

const NoTeamsTest = require('./no_teams_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class EligibleJoinCompaniesTest extends NoTeamsTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
	}

	get description () {
		return 'user should receive eligible companies to join via domain-based and code-host-based with response to check signup';
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
