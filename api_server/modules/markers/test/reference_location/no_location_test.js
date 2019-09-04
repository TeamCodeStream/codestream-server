'use strict';

const ReferenceLocationTest = require('./reference_location_test');

class NoLocationTest extends ReferenceLocationTest {

	get description () {
		return 'should return an error when trying to add a reference location for a marker with no location';
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
			delete this.data.location;
			callback();
		});
	}
}

module.exports = NoLocationTest;
