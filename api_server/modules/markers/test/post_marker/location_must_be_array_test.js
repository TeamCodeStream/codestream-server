'use strict';

const PostMarkerTest = require('./post_marker_test');

class LocationMustBeArrayTest extends PostMarkerTest {

	get description () {
		return 'should return an error when trying to create a marker with a location that is not an array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid location'
		};
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// change the given location
		super.makeMarkerData(() => {
			this.data.location = 'x';
			callback();
		});
	}
}

module.exports = LocationMustBeArrayTest;
