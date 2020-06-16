'use strict';

const PutMarkerLocationsTest = require('./put_marker_locations_test');

class BadLocationTest extends PutMarkerLocationsTest {

	get description () {
		return 'should return error when attempting to put marker locations with a bad location';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'location must be an array'
		};
	}

	// set the data to be used in the PUT request
	setData (callback) {
		super.setData(() => {
			const markerId = Object.keys(this.data.locations)[0];
			this.data.locations[markerId] = 1; // the location object needs to be an array
			callback();
		});
	}
}

module.exports = BadLocationTest;
