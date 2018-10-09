'use strict';

const PostMarkerTest = require('./post_marker_test');

class LocationTooShortTest extends PostMarkerTest {

	get description () {
		return 'should return an error when trying to create a marker with a location that has less than 4 elements';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid location'
		};
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// cut the given location down to 3 elements
		super.makeMarkerData(() => {
			this.data.location.splice(3);
			callback();
		});
	}
}

module.exports = LocationTooShortTest;
