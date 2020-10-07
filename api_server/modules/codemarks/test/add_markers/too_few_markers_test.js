'use strict';

const AddMarkersTest = require('./add_markers_test');

class TooFewMarkersTest extends AddMarkersTest {

	get description() {
		return 'should return an error when attempting to add zero markers to a codemark';
	}

	getExpectedError() {
		return {
			code: 'RAPI-1005'
		};
	}

	// before the test runs...
	before(callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.markers = [];
			callback();
		});
	}
}

module.exports = TooFewMarkersTest;
