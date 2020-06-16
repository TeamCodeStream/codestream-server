'use strict';

const GetMarkersTest = require('./get_markers_test');
const ObjectID = require('mongodb').ObjectID;

class StreamNotFoundTest extends GetMarkersTest {

	get description () {
		return 'should return an error when trying to fetch markers from a stream that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'stream'
		};
	}

	// get query parameters to use for the test
	getQueryParameters () {
		const queryParameters = super.getQueryParameters();
		// set the stream ID to an ID that doesn't exist
		queryParameters.streamId = ObjectID();
		return queryParameters;
	}
}

module.exports = StreamNotFoundTest;
