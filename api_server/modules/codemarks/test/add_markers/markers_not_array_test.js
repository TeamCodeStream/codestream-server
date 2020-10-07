'use strict';

const AddMarkersTest = require('./add_markers_test');

class MarkersNotArrayTest extends AddMarkersTest {

	get description () {
		return 'should return an error when attempting to add markers to a codemark with markers attribute that is not an array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			info: 'markers'
		};
	}

	makeTestData (callback) {
		// use a "numeric" markers structure ... not allowed!
		super.makeTestData(() => {
			this.data.markers = 1;
			callback();
		});
	}
}

module.exports = MarkersNotArrayTest;
