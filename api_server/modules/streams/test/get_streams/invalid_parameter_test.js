'use strict';

var GetStreamsTest = require('./get_streams_test');

class InvalidParameterTest extends GetStreamsTest {

	get description () {
		return 'should return an error if an unknown query parameter is provided trying to get a stream';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// add a bogus query parameter
		this.path = `/streams?teamId=${this.myTeam._id}&repoId=${this.myRepo._id}&thisparam=1`;
		callback();
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'invalid query parameter'
		};
	}
}

module.exports = InvalidParameterTest;
