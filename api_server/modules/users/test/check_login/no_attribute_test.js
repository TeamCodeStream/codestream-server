'use strict';

const CheckLoginTest = require('./check_login_test');

class NoAttributeTest extends CheckLoginTest {

	get description () {
		return `should return error when no ${this.attribute} provided to login check`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// before the test runs...
	before (callback) {
		// remove the given attribute
		super.before(() => {
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = NoAttributeTest;
