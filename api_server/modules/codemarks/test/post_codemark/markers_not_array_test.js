'use strict';

const MarkerTest = require('./marker_test');

class MarkersNotArrayTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create an codemark with markers attribute that is not an array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'markers: must be an array of objects'
		};
	}

	// form the data to use in trying to create the codemark
	makeCodeMarkData (callback) {
		// use a "numeric" markers structure ... not allowed!
		super.makeCodeMarkData(() => {
			this.data.markers = 1;
			callback();
		});
	}
}

module.exports = MarkersNotArrayTest;
