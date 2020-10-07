'use strict';

const AddMarkersTest = require('./add_markers_test');

class LocationTooShortTest extends AddMarkersTest {

	get description () {
		return 'should return an error when attempting to add markers to a codemark with a marker element where the location array is too short';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'location array must have at least 4 elements'
		};
	}

	// form the data to use in trying to create the codemark
	makeTestData (callback) {
		// 3 elements in the location array ... not allowed!
		super.makeTestData(() => {
			this.data.markers[0].location = [1, 2, 3];
			callback();
		});
	}
}

module.exports = LocationTooShortTest;
