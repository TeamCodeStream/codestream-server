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

	// before the test runs...
	before (callback) {
		// run standard set up for a confirmation test but delete the attribute indicated
		super.before(() => {
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = NoAttributeTest;
