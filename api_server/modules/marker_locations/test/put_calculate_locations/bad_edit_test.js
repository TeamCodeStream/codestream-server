'use strict';

var PutCalculateLocationsTest = require('./put_calculate_locations_test');

class BadEditTest extends PutCalculateLocationsTest {

	get description () {
		return 'should return error when attempting to put marker locations with a bad edit';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			info: 'edits.*delStart is not a number'
		};
	}

	// set the data to be used in the PUT request
	setData (callback) {
		super.setData(() => {
			this.data.edits[0].delStart = 'x';	// should be numeric
			callback();
		});
	}
}

module.exports = BadEditTest;
