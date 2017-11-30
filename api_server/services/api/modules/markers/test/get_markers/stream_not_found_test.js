'use strict';

var GetMarkersTest = require('./get_markers_test');
var ObjectID = require('mongodb').ObjectID;

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

	getQueryParameters () {
		let queryParameters = super.getQueryParameters();
		queryParameters.streamId = ObjectID();
		return queryParameters;
	}
}

module.exports = StreamNotFoundTest;
