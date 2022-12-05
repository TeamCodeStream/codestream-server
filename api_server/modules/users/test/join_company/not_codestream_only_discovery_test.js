'use strict';

const JoinCompanyTest = require('./join_company_test');

class NotCodeStreamOnlyDiscoveryTest extends JoinCompanyTest {

	get description () {
		return 'should return an error when trying to join a company whose associated org is found to be not codestream-only by checking with New Relic';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1003',
			reason: 'membership in this company is managed by New Relic'			
		};
	}

	init (callback) {
		// add header to the test request to mock a response from NR that indicates the org
		// is no longer codestream-only
		this.apiRequestOptions = this.apiRequestOptions || {};
		this.apiRequestOptions.headers = this.apiRequestOptions.headers || {};
		this.apiRequestOptions.headers['x-cs-mock-no-cs-only'] = true;
		super.init(callback);
	}
}

module.exports = NotCodeStreamOnlyDiscoveryTest;
