'use strict';

const MarkerTest = require('./marker_test');

class NoCommitHashWithFileTest extends MarkerTest {

	constructor (options) {
		super(options);
		this.dontExpectFileStreamId = true;
		this.dontExpectRepoId = true;
		this.dontExpectRepo = true;
	}

	get description () {
		return 'should be ok to create an codemark with a marker but not providing a commit hash even if there is a file';
	}

	// form the data to use in trying to create the codemark
	makeCodeMarkData (callback) {
		// remove the commit hash from the data to use in creating the codemark
		// also remove the stream ID but supply a file, making the statement 
		// that we are not associating the marker with a stream at all...
		// but we still have a file name
		super.makeCodeMarkData(() => {
			const marker = this.data.markers[0];
			delete marker.commitHash;
			delete marker.fileStreamId;
			this.expectedFile = marker.file = this.streamFactory.randomFile();
			callback();
		});
	}
}

module.exports = NoCommitHashWithFileTest;
