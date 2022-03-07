'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');

class ChangeEmailTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		delete this.teamOptions.creatorIndex;
		this.userOptions.numRegistered = 1;
	}

	get description () {
		return 'should change a user\'s email across environments when requested';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/xenv/change-email';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data = {
				email: this.users[0].user.email,
				toEmail: this.userFactory.randomEmail()
			};
			this.apiRequestOptions = {
				headers: {
					'X-CS-Auth-Secret': this.apiConfig.sharedSecrets.auth
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

module.exports = ChangeEmailTest;
