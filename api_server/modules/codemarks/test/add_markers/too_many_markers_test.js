'use strict';

const AddMarkersTest = require('./add_markers_test');

class TooManyMarkersTest extends AddMarkersTest {

	get description() {
		return 'should return an error when attempting to add too many markers to a codemark';
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
			for (let i = 0; i < 100; i++) {
				this.data.markers.push(this.data.markers[0]);
			}
			callback();
		});
	}
}

module.exports = TooManyMarkersTest;
