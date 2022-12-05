'use strict';

const PostUserTest = require('./post_user_test');

class NotCodeStreamOnlyDiscoveryTest extends PostUserTest {

	get description () {
		return 'should return an error when trying to create a user on a team when the team\'s associated org is found to be not codestream-only by checking with New Relic';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'member management for this company can only be done through New Relic'			
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
