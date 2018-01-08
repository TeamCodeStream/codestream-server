'use strict';

var PutMarkerLocationsTest = require('./put_marker_locations_test');

class StreamNotFoundTest extends PutMarkerLocationsTest {

	get description () {
		return 'should return error when attempting to put marker locations with a stream that doesn\'t exist';
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
