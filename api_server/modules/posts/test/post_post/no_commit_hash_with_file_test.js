'use strict';

const ItemMarkerTest = require('./item_marker_test');

class NoCommitHashWithFileTest extends ItemMarkerTest {

	constructor (options) {
		super(options);
		this.dontExpectCommitHash = true;
		this.dontExpectRepo = true;
		this.dontExpectRepoId = true;
		this.dontExpectFileStreamId = true;
	}

	get description () {
		return 'should be ok to create a post and item with a marker but not providing a commit hash even if there is a file';
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// remove the commit hash from the data to use in creating the post
		// also remove the stream ID but supply a file, making the statement 
		// that we are not associating the marker with a stream at all...
		// but we still have a file name
		super.makePostData(() => {
			const marker = this.data.item.markers[0];
			delete marker.commitHash;
			delete marker.fileStreamId;
			this.expectedFile = marker.file = this.streamFactory.randomFile();
			callback();
		});
	}
}

module.exports = NoCommitHashWithFileTest;
