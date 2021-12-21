'use strict';

const AssignNRObjectTest = require('./assign_nr_object_test');

class ParameterRequiredTest extends AssignNRObjectTest {

	get description () {
		return `should return an error when trying to assign a user to a New Relic object but without providing ${this.parameter}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data[this.parameter];
			callback();
		});
	}
}

module.exports = ParameterRequiredTest;
