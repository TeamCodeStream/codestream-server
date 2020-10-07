'use strict';

const MarkerStreamOnTheFlyTest = require('./marker_stream_on_the_fly_test');

class OnTheFlyMarkerStreamNoRemotesTest extends MarkerStreamOnTheFlyTest {

	constructor (options) {
		super(options);
		this.repoOnTheFly = false;
		this.streamOnTheFly = false;
		this.dontExpectFileStreamId = true;
		this.dontExpectRepoId = true;
		this.dontExpectRepo = true;
		this.dontExpectMarkerLocations = true;
		this.expectMarkers = 1;
	}

	get description () {
		return 'should be ok when adding markers to a codemark with an on-the-fly stream without providing remotes';
	}

	// before the test runs...
	before (callback) {
		// for the stream we want to create on-the-fly, remove the repo ID
		super.before(error => {
			if (error) { return callback(error); }
			const marker = this.data.markers[0];
			this.expectedFile = marker.file;
			delete marker.remotes;
			callback();
		});
	}
}

module.exports = OnTheFlyMarkerStreamNoRemotesTest;
