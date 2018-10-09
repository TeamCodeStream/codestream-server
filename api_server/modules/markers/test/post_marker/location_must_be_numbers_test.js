'use strict';

const PostMarkerTest = require('./post_marker_test');

class LocationMustBeNumbersTest extends PostMarkerTest {

	get description () {
		return 'should return an error when trying to create a marker with a location that is not numbers in the first 4 coordinates';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid location'
		};
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// change one of the coordinates to a string
		super.makeMarkerData(() => {
			this.data.location[2] = 'x';
			callback();
		});
	}
}

module.exports = LocationMustBeNumbersTest;
