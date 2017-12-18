'use strict';

var PutMarkerLocationsTest = require('./put_marker_locations_test');

class BadMarkerIdTest extends PutMarkerLocationsTest {

	get description () {
		return 'should return error when attempting to put marker locations with a bad marker ID';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'is not a valid marker ID'
		};
	}

	// set the data to be used in the PUT request
	setData (callback) {
		super.setData(() => {
			this.data.locations.x = [1]; // use a bad ID in the locations object
			callback();
		});
	}
}

module.exports = BadMarkerIdTest;
