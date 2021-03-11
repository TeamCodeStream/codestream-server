'use strict';

const MarkerStreamOnTheFlyTest = require('./marker_stream_on_the_fly_test');
const Assert = require('assert');

class DuplicateFileStreamTest extends MarkerStreamOnTheFlyTest {

	constructor (options) {
		super(options);
		this.repoOnTheFly = false;
		this.expectedSeqNum = 2;
		this.expectedStreamVersion = 3;
		this.expectStreamMarkers = 2;
	}

	get description () {
		return 'should find and use the existing stream when creating a post and codemark and creating a file stream on the fly with matching path';
	}

	makePostData (callback) {
		super.makePostData(() => {
			// substitute the path for the existing file-stream, without providing its ID
			const marker = this.data.codemark.markers[0];
			delete marker.fileStreamId;
			delete marker.remotes;
			marker.repoId = this.repo.id;
			marker.file = this.repoStreams[0].file;
			callback();
		});
	}

	// validate the response to the post request
	validateResponse (data) {
		// validate that the marker points to the file stream that was already created
		Assert(data.markers[0].fileStreamId === this.repoStreams[0].id, 'returned stream should be the same as the existing file stream');
		super.validateResponse(data);
	}
}

module.exports = DuplicateFileStreamTest;
