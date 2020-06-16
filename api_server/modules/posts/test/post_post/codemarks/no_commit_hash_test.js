'use strict';

const CodemarkMarkerTest = require('./codemark_marker_test');

class NoCommitHashTest extends CodemarkMarkerTest {

	constructor (options) {
		super(options);
		this.dontExpectCommitHash = true;
		this.dontExpectFile = true;
		this.dontExpectRepo = true;
		this.dontExpectFileStreamId = true;
		this.dontExpectRepoId = true;
	}

	get description () {
		return 'should be ok to create a post with an codemark and a marker but not providing a commit hash as long as there is also no stream';
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// remove the commit hash from the data to use in creating the post
		// also remove the stream ID, making the statement that we are not associating the marker with a stream at all
		super.makePostData(() => {
			const marker = this.data.codemark.markers[0];
			delete marker.commitHash;
			delete marker.fileStreamId;	
			callback();
		});
	}
}

module.exports = NoCommitHashTest;
