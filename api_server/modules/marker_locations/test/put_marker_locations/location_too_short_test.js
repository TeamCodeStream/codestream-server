'use strict';

const PutMarkerLocationsTest = require('./put_marker_locations_test');

class LocationTooShortTest extends PutMarkerLocationsTest {

	get description () {
		return 'should return error when attempting to put marker locations with a location array that is too short';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'location array must have at least 4 elements'
		};
	}

	// set the data to be used in the PUT request
	setData (callback) {
		super.setData(() => {
			const markerId = Object.keys(this.data.locations)[0];
			this.data.locations[markerId] = [1, 2, 3];	// must have at least 4 elements
			callback();
		});
	}
}

module.exports = LocationTooShortTest;
