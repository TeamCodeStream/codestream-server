'use strict';

const MarkerStreamOnTheFlyTest = require('./marker_stream_on_the_fly_test');
const ObjectID = require('mongodb').ObjectID;

class OnTheFlyMarkerStreamRepoNotFoundTest extends MarkerStreamOnTheFlyTest {

	get description () {
		return 'should return an error when attempting to create a post with a marker with an on-the-fly stream with an invalid repo id';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'repo'
		};
	}

	// before the test runs...
	before (callback) {
		// for the stream we want to create on-the-fly, substitute an ID for a non-existent repo
		super.before(error => {
			if (error) { return callback(error); }
			this.data.markers[0].repoId = ObjectID();
			callback();
		});
	}
}

module.exports = OnTheFlyMarkerStreamRepoNotFoundTest;
