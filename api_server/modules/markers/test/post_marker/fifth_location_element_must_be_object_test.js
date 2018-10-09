'use strict';

const PostMarkerTest = require('./post_marker_test');

class FifthLocationElementMustBeObjectTest extends PostMarkerTest {

	get description () {
		return 'should return an error when trying to create a marker with a location for which the fifth element is not an object';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid location'
		};
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// replace fifth element with a string
		super.makeMarkerData(() => {
			this.data.location[4] = 'x';
			callback();
		});
	}
}

module.exports = FifthLocationElementMustBeObjectTest;
