'use strict';

const GitLensUserTest = require('./gitlens_user_test');

class TooManyEmailHashesTest extends GitLensUserTest {

	get description () {
		return `should return an error when submitting a request to create a GitLens user with a too many email hashes`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			reason: this.parameter
		};
	}

	// before the test runs...
	before (callback) {
		// generate many, many email hashes
		super.before(error => {
			if (error) { return callback(error); }
			for (let i = 0; i < 51; i++) {
				this.data.emailHashes.push(this.userFactory.randomEmail());
			}
			callback();
		});
	}
}

module.exports = TooManyEmailHashesTest;
