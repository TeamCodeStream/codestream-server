'use strict';

var GetStreamsTest = require('./get_streams_test');
var ObjectID = require('mongodb').ObjectID;

class GetStreamsLessThanTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting streams with sort IDs less than some value';
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
		this.expectedStreams = this.expectedStreams.filter(stream => ObjectID(stream.sortId) < ObjectID(pivot));
		this.path = `/streams?teamId=${this.team.id}&lt=${pivot}`;
		callback();
	}
}

module.exports = GetStreamsLessThanTest;
