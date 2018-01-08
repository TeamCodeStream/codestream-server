'use strict';

var PutCalculateLocationsTest = require('./put_calculate_locations_test');

class MissingEditElementTest extends PutCalculateLocationsTest {

	get description () {
		return 'should return error when attempting to put marker locations with an edit object missing an element';
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
			delete this.data.edits[0].delStart;
			callback();
		});
	}
}

module.exports = MissingEditElementTest;
