'use strict';

const AddMarkersTest = require('./add_markers_test');

class ParameterRequiredTest extends AddMarkersTest {

	get description () {
		return `should return an error when attempting to add markers to a codemark with no ${this.parameter}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	// before the test runs...
	before (callback) {
		// delete the parameter when we try to create the codemark 
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data[this.parameter];
			callback();
		});
	}
}

module.exports = ParameterRequiredTest;
