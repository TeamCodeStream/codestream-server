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

	setData (callback) {
		super.setData(() => {
			this.data.streamId = 'x';
			callback();
		});
	}
}

module.exports = StreamNotFoundTest;
