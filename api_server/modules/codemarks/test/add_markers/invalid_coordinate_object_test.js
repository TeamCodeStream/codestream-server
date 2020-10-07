'use strict';

const AddMarkersTest = require('./add_markers_test');

class InvalidCoordinateObjectTest extends AddMarkersTest {

	get description () {
		return 'should return error when attempting to add markers to a codemark with a marker element where the fifth location coordinate is not an object';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'fifth element of location must be an object'
		};
	}

	// form the data to use in trying to create the codemark
	makeTestData (callback) {
		// add a fifth coordinate element that is not an object ... not allowed!
		super.makeTestData(() => {
			this.data.markers[0].location = [1, 2, 3, 4, 5];
			callback();
		});
	}
}

module.exports = InvalidCoordinateObjectTest;
