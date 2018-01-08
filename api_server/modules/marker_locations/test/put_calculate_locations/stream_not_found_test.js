'use strict';

var PutCalculateLocationsTest = require('./put_calculate_locations_test');

class StreamNotFoundTest extends PutCalculateLocationsTest {

	get description () {
		return 'should return error when attempting to calculate marker locations with a stream that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'stream'
		};
	}

	// set the data to be used in the request
	setData (callback) {
		super.setData(() => {
			// put marker locations for a bogus stream ID
			this.data.streamId = 'x';
			callback();
		});
	}
}

module.exports = StreamNotFoundTest;
