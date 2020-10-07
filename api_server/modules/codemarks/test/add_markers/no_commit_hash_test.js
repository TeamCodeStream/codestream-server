'use strict';

const AddMarkersTest = require('./add_markers_test');

class NoCommitHashTest extends AddMarkersTest {

	constructor (options) {
		super(options);
		this.dontExpectCommitHash = true;
		this.dontExpectFile = true;
		this.dontExpectRepo = true;
		this.dontExpectFileStreamId = true;
		this.dontExpectRepoId = true;
	}

	get description () {
		return 'should be ok to add markers to a codemark but not providing a commit hash as long as there is also no stream';
	}

	// form the data to use in trying to add the markers
	makeTestData (callback) {
		// remove the commit hash from the data to use in adding the markers
		// also remove the stream ID, making the statement that we are not associating the marker with a stream at all
		super.makeTestData(() => {
			this.data.markers.forEach(marker => {
				delete marker.commitHash;
				delete marker.fileStreamId;
			});
			callback();
		});
	}
}

module.exports = NoCommitHashTest;
