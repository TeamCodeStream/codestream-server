'use strict';

const AddMarkersTest = require('./add_markers_test');

class MarkerNotObjectTest extends AddMarkersTest {

	get description () {
		return 'should return an error when attempting to add markers to a codemark with a marker element that is not an object';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			info: 'markers'
		};
	}

	// form the data to use in trying to create the codemark
	makeTestData (callback) {
		// we'll add a "numeric" code-block ... not allowed!
		super.makeTestData(() => {
			this.data.markers.push(1);
			callback();
		});
	}
}

module.exports = MarkerNotObjectTest;
