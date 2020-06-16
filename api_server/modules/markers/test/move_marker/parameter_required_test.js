'use strict';

const MoveTest = require('./move_test');

class ParameterRequiredTest extends MoveTest {

	get description () {
		return `should return an error when trying to move the location for a marker with no ${this.parameter}`;
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
