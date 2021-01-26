'use strict';

const GitLensUserTest = require('./gitlens_user_test');

class EmailHashesRequiredTest extends GitLensUserTest {

	get description () {
		return 'should return an error when submitting a request to create a GitLens user without providing a email hashes';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'emailHashes'
		};
	}

	// before the test runs...
	before (callback) {
		// delete the email hash from the data to submit with the request
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.emailHashes;
			callback();
		});
	}
}

module.exports = EmailHashesRequiredTest;
