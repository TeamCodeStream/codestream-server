'use strict';

const CheckLoginTest = require('./check_login_test');

class InvalidEmailTest extends CheckLoginTest {

	get description () {
		return 'should return error when invalid email provided to login check';
	}

	getExpectedError () {
		return {
			code: 'USRC-1001'
		};
	}

	// before the test runs...
	before (callback) {
		// replace the test email with something random...
		super.before((error) => {
			if (error) { return callback(error); }
			this.data.email = this.userFactory.randomEmail();
			callback();
		});
	}
}

module.exports = InvalidEmailTest;
