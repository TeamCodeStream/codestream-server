'use strict';

const RegistrationTest = require('./registration_test');

class TrimEmailTest extends RegistrationTest {

	get description() {
		return 'should trim leading and trailing spaces from email upon registration';
	}

	// before the test runs...
	before(callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.email = ` ${this.data.email} `;
			callback();
		});
	}
}

module.exports = TrimEmailTest;
