'use strict';

const AddMarkersTest = require('./add_markers_test');

class MarkerAttributeRequiredTest extends AddMarkersTest {

	get description () {
		return `should return an error when attempting to add markers to a codemark with a marker element with no ${this.attribute} parameter`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// form the data to use in trying to create the codemark
	makeTestData (callback) {
		// delete the marker attribute
		super.makeTestData(() => {
			delete this.data.markers[0][this.attribute];
			callback();
		});
	}
}

module.exports = MarkerAttributeRequiredTest;
