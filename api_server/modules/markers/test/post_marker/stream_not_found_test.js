'use strict';

const PostMarkerTest = require('./post_marker_test');
const ObjectID = require('mongodb').ObjectID;

class StreamNotFoundTest extends PostMarkerTest {

	get description () {
		return 'should return an error when trying to create a marker referencing a stream that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'stream'
		};
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// substitute an invalid ID for the stream ID
		super.makeMarkerData(() => {
			this.data.streamId = ObjectID();
			callback();
		});
	}
}

module.exports = StreamNotFoundTest;
