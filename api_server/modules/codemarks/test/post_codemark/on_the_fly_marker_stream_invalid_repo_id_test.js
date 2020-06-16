'use strict';

const MarkerStreamOnTheFlyTest = require('./marker_stream_on_the_fly_test');

class OnTheFlyMarkerStreamInvalidRepoIdTest extends MarkerStreamOnTheFlyTest {

	get description () {
		return 'should return an error when attempting to create an codemark with a marker with an on-the-fly stream with a bogus repo id';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'marker repo'
		};
	}

	// before the test runs...
	before (callback) {
		// for the stream we want to create on-the-fly, substitute a bogus ID for the repo
		super.before(error => {
			if (error) { return callback(error); }
			const marker = this.data.markers[0];
			delete marker.remotes;
			marker.repoId = 'x';
			callback();
		});
	}
}

module.exports = OnTheFlyMarkerStreamInvalidRepoIdTest;
