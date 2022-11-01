'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');

class PublishEligibleJoinCompaniesTest extends CodeStreamAPITest {

	get description () {
		return 'cross-environment request to publish eligible join companies for an email should succeed';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/xenv/publish-ejc';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data = {
				email: this.currentUser.user.email
			};
			this.apiRequestOptions = {
				headers: {
					'X-CS-Auth-Secret': this.apiConfig.environmentGroupSecrets.requestAuth
				}
			};
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepStrictEqual(data, {}, 'empty response expected');
	}
}

module.exports = PublishEligibleJoinCompaniesTest;
