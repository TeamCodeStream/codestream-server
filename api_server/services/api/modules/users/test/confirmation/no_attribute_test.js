'use strict';

var ConfirmationTest = require('./confirmation_test');

class NoAttributeTest extends ConfirmationTest {

	get description () {
		return `should return an error when confirming a registration with no ${this.attribute}`;
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
