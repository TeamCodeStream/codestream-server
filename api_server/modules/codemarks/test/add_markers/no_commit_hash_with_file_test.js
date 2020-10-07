'use strict';

const AddMarkersTest = require('./add_markers_test');

class NoCommitHashWithFileTest extends AddMarkersTest {

	constructor (options) {
		super(options);
		this.dontExpectFileStreamId = true;
		this.dontExpectRepoId = true;
		this.dontExpectRepo = true;
	}

	get description () {
		return 'should be ok to add markers to a codemark but not providing a commit hash even if there is a file';
	}

	// form the data to use in trying to add the markers
	makeTestData (callback) {
		// remove the commit hash from the data to use in adding the markers
		// also remove the stream ID but supply a file, making the statement 
		// that we are not associating the marker with a stream at all...
		// but we still have a file name
		super.makeTestData(() => {
			this.expectedFiles = [];
			this.data.markers.forEach(marker => {
				delete marker.commitHash;
				delete marker.fileStreamId;
				marker.file = this.streamFactory.randomFile();
				this.expectedFiles.push(marker.file);
			});
			callback();
		});
	}
}

module.exports = NoCommitHashWithFileTest;
