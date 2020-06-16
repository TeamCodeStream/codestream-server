'use strict';

const LoginTest = require('./login_test');

class InvalidEmailTest extends LoginTest {

	get description () {
		return 'should return error when invalid email provided';
	}

	getExpectedFields () {
		return null;
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
