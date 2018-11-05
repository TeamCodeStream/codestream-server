'use strict';

const MarkerTest = require('./marker_test');

class InvalidCoordinateObjectTest extends MarkerTest {

	get description () {
		return 'should return error when attempting to create an codemark with a marker element where the fifth location coordinate is not an object';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'fifth element of location must be an object'
		};
	}

	// form the data to use in trying to create the codemark
	makeCodemarkData (callback) {
		// add a fifth coordinate element that is not an object ... not allowed!
		super.makeCodemarkData(() => {
			this.data.markers[0].location = [1, 2, 3, 4, 5];
			callback();
		});
	}
}

module.exports = InvalidCoordinateObjectTest;
