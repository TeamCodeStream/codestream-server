'use strict';

const MarkerTest = require('./marker_test');

class MarkerAttributeRequiredTest extends MarkerTest {

	get description () {
		return `should return an error when attempting to create an codemark with a marker element with no ${this.attribute} parameter`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// form the data to use in trying to create the codemark
	makeCodemarkData (callback) {
		// delete the marker attribute
		super.makeCodemarkData(() => {
			delete this.data.markers[0][this.attribute];
			callback();
		});
	}
}

module.exports = MarkerAttributeRequiredTest;
