'use strict';

var PutMarkerLocationsTest = require('./put_marker_locations_test');

class LocationsTooLargeTest extends PutMarkerLocationsTest {

	get description () {
		return 'should return error when attempting to put marker locations with object that is too large';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'locations object is too large'
		};
	}

	setData (callback) {
		super.setData(() => {
			for (let i = 0; i < 1001; i++) {
				this.data.locations[i] = i;
			}
			callback();
		});
	}
}

module.exports = LocationsTooLargeTest;
