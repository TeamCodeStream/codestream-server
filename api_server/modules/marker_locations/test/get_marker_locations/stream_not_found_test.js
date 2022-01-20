'use strict';

const GetMarkerLocationsTest = require('./get_marker_locations_test');
const ObjectId = require('mongodb').ObjectId;

class StreamNotFoundTest extends GetMarkerLocationsTest {

	get description () {
		return 'should return an error when trying to fetch marker locations from a stream that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'stream'
		};
	}

	// get query parameters for the request
	getQueryParameters () {
		const queryParameters = super.getQueryParameters();
		queryParameters.streamId = ObjectId();	// set the stream ID to some random ID that doesn't exist
		return queryParameters;
	}
}

module.exports = StreamNotFoundTest;
