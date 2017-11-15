'use strict';

var RegistrationTest = require('./registration_test');

class NoAttributeTest extends RegistrationTest {

	get description () {
		return `should return error when registering with no ${this.attribute}`;
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	before (callback) {
		super.before(() => {
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = NoAttributeTest;
