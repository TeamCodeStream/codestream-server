'use strict';

const RepoBasedSignupTest = require('./repo_based_signup_test');

class RepoBasedSignupParameterRequiredTest extends RepoBasedSignupTest {

	get description() {
		return `should return error when registering using repo-based signup with no ${this.attribute}`;
	}

	getExpectedFields() {
		return null;
	}

	getExpectedError() {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// before the test runs...
	before(callback) {
		// delete the attribute in question
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = RepoBasedSignupParameterRequiredTest;
