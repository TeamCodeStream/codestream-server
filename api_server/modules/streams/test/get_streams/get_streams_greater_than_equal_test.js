'use strict';

const GetStreamsTest = require('./get_streams_test');
const ObjectId = require('mongodb').ObjectId;

class GetStreamsGreaterThanEqualTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting streams with sort IDs greater than or equal to some value';
	}

	setTestOptions (callback) {
		this.dontDoForeign = true;
		//this.dontDoDirectStreams = true;
		this.dontDoFileStreams = true;
		super.setTestOptions(callback);
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		this.expectedStreams = this.getExpectedStreams();
		const pivot = this.expectedStreams[2].id;
		this.expectedStreams = this.expectedStreams.filter(stream => ObjectId(stream.sortId) >= ObjectId(pivot));
		this.path = `/streams?teamId=${this.team.id}&gte=${pivot}`;
		callback();
	}
}

module.exports = GetStreamsGreaterThanEqualTest;
