'use strict';

const EditingTest = require('./editing_test');

class NoParameterTest extends EditingTest {

	get description () {
		return `should return an error when performing an editing request with no ${this.parameter}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	// before the test runs...
	before (callback) {
		// run standard set up for the test but delete the parameter indicated
		super.before(() => {
			delete this.data[this.parameter];
			callback();
		});
	}
}

module.exports = NoParameterTest;
