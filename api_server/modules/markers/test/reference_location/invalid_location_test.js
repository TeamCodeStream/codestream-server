'use strict';

const ReferenceLocationTest = require('./reference_location_test');

class InvalidLocationTest extends ReferenceLocationTest {

	get description () {
		return 'should return an error when trying to add a reference location for a marker with an invalid location';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid location'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.location = 'x';
			callback();
		});
	}
}

module.exports = InvalidLocationTest;
