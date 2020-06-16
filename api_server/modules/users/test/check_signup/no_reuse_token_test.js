'use strict';

const CheckSignupTest = require('./check_signup_test');

class NoReuseTokenTest extends CheckSignupTest {

	get description () {
		return 'should not be able to reuse a signup token after it has been used once';
	}

	getExpectedError () {
		if (this.secondTime) {
			return {
				code: 'AUTH-1006'
			};
		}
		else {
			return null;
		}
	}

	// run the actual test...
	run (callback) {
		// run the usual test, but then try to run again...
		super.run(error => {
			if (error) { return callback(error); }
			this.secondTime = true;
			super.run(callback);
		});
	}
}

module.exports = NoReuseTokenTest;
