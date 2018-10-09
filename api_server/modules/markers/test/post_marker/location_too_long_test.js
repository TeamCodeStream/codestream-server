'use strict';

const PostMarkerTest = require('./post_marker_test');

class LocationTooLongTest extends PostMarkerTest {

	get description () {
		return 'should return an error when trying to create a marker with a location that has more than 5 elements';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid location'
		};
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// add a few coordinates to the location
		super.makeMarkerData(() => {
			this.data.location.push(1);
			this.data.location.push(2);
			callback();
		});
	}
}

module.exports = LocationTooLongTest;
