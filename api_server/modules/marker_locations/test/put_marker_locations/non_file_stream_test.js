'use strict';

const PutMarkerLocationsTest = require('./put_marker_locations_test');

class NonFileStreamTest extends PutMarkerLocationsTest {

	get description () {
		return `should return error when attempting to put marker locations for a ${this.streamType} stream`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.streamId = this.stream._id;
			callback();
		});
	}
}

module.exports = NonFileStreamTest;
