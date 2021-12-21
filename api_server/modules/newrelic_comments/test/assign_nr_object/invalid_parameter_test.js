'use strict';

const AssignNRObjectTest = require('./assign_nr_object_test');

class InvalidParameterTest extends AssignNRObjectTest {

	get description () {
		return `should return an error when trying to assign a user to a New Relic object but providing an invalid ${this.parameter}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			info: this.parameter
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			if (this.shouldBeNumber) {
				this.data[this.parameter] = 'string bad!';
			} else {
				this.data[this.parameter] = Math.floor(Math.random() * 100000000);
			}
			callback();
		});
	}
}

module.exports = InvalidParameterTest;
