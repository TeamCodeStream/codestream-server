'use strict';

const ReviewMarkersTest = require('./review_markers_test');

class NoReviewCommitHashTest extends ReviewMarkersTest {

	constructor (options) {
		super(options);
		this.dontExpectCommitHash = true;
		this.dontExpectFile = true;
		this.dontExpectRepo = true;
		this.dontExpectFileStreamId = true;
		this.dontExpectRepoId = true;
		this.expectMarkers = 1;
		this.expectStreamMarkers = 2;
	}

	get description () {
		return 'should be ok to create a post with a review and a marker but not providing a commit hash as long as there is also no stream';
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// remove the commit hash from the data to use in creating the post
		// also remove the stream ID, making the statement that we are not associating the marker with a stream at all
		super.makePostData(() => {
			const marker = this.data.review.markers[0];
			delete marker.commitHash;
			delete marker.fileStreamId;	
			callback();
		});
	}
}

module.exports = NoReviewCommitHashTest;
