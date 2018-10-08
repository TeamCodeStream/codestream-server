'use strict';

const PostMarkerTest = require('./post_marker_test');

class NoAttributeTest extends PostMarkerTest {

	get description () {
		return `should return an error when trying to create a marker without providing ${this.attribute} attribute`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// remove the given attribute
		super.makeMarkerData(() => {
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = NoAttributeTest;
