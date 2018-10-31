'use strict';

const MarkerStreamOnTheFlyTest = require('./marker_stream_on_the_fly_test');

class OnTheFlyMarkerStreamNoRepoIdTest extends MarkerStreamOnTheFlyTest {

	constructor (options) {
		super(options);
		this.dontExpectStreams = true;
		this.dontExpectMarkers = true;
	}

	get description () {
		return 'should be ok when creating a post with a marker with an on-the-fly stream without providing a repo ID';
	}

	// before the test runs...
	before (callback) {
		// for the stream we want to create on-the-fly, remove the repo ID
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.markers[0].repoId;
			callback();
		});
	}

	// validate that there was a stream update which increments the number of markers...
	validateMarkerStreamUpdate () {
		// ... but since no repo ID was supplied, there are no markers, so no increment
	}	
}

module.exports = OnTheFlyMarkerStreamNoRepoIdTest;
