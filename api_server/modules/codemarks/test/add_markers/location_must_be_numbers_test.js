'use strict';

const AddMarkersTest = require('./add_markers_test');

class LocationMustBeNumbersTest extends AddMarkersTest {

	get description () {
		return 'should return an error when attempting to add markers to a codemark with a marker element where the location array does not contain all numbers';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'first four coordinations of location array must be numbers'
		};
	}

	// form the data to use in trying to create the codemark
	makeTestData (callback) {
		// set an element in the location array to a non-numeric ... not allowed!
		super.makeTestData(() => {
			this.data.markers[0].location = [1, 2, 'x', 4];
			callback();
		});
	}
}

module.exports = LocationMustBeNumbersTest;
