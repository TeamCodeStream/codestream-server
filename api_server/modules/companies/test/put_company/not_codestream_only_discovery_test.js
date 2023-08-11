'use strict';

const PutCompanyTest = require('./put_company_test');

class NotCodeStreamOnlyDiscoveryTest extends PutCompanyTest {

	constructor (options) {
		super(options);
		this.unifiedIdentityEnabled = true;
	}
	
	get description () {
		return 'should return an error when trying to update a company that is found to be not codestream-only by checking with New Relic';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'this company/org is managed by New Relic and can not be updated'
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
