'use strict';

const GitLensUserTest = require('./gitlens_user_test');

class MultipleEmailHashesTest extends GitLensUserTest {

	get description () {
		return 'should be ok to provide multiple email hashes when creating a GitLens user';
	}

	// before the test runs...
	before (callback) {
		// add more email hashes
		super.before(error => {
			if (error) { return callback(error); }
			this.data.emailHashes = [
				...this.data.emailHashes,
				this.userFactory.randomEmail(),
				this.userFactory.randomEmail()
			];
			callback();
		});
	}
}

module.exports = MultipleEmailHashesTest;
