'use strict';

const AddAdminTest = require('./add_admin_test');

class NotCodeStreamOnlyDiscoveryAddAdminTest extends AddAdminTest {

	constructor (options) {
		super(options);
		this.unifiedIdentityEnabled = true;
	}

	get description () {
		return 'should return an error when trying to remove a user from a team when the team\'s associated org is found to be not codestream-only by checking with New Relic';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1004',
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

module.exports = NotCodeStreamOnlyDiscoveryAddAdminTest;
