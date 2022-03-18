'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');
const RandomString = require('randomstring');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class EligibleJoinCompaniesTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'should return eligible companies matching a given domain in response to a cross-environment request';
	}

	get method () {
		return 'get';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.createEligibleJoinCompanies(callback);
		});
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
				this.path = '/xenv/eligible-join-companies?domain=' + encodeURIComponent(domain);
				this.apiRequestOptions = {
					headers: {
						'X-CS-Auth-Secret': this.apiConfig.environmentGroupSecrets.requestAuth
					}
				};
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
