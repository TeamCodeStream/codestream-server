'use strict';

const MarkerTest = require('./marker_test');

class LocationMustBeArrayTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create a post with a marker element where the location is not an array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid location'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// set the location for the marker to a "numeric" ... not allowed!
		super.makePostData(() => {
			this.data.markers[0].location = 1;
			callback();
		});
	}
}

module.exports = LocationMustBeArrayTest;
