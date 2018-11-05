'use strict';

const MarkerStreamOnTheFlyTest = require('./marker_stream_on_the_fly_test');
const Assert = require('assert');

class DuplicateFileStreamTest extends MarkerStreamOnTheFlyTest {

	constructor (options) {
		super(options);
		this.repoOnTheFly = false;
	}

	get description () {
		return 'should find and use the existing stream when creating an codemark and creating a file stream on the fly with matching path';
	}

	makeCodemarkData (callback) {
		super.makeCodemarkData(() => {
			// substitute the path for the existing file-stream, without providing its ID
			const marker = this.data.markers[0];
			delete marker.fileStreamId;
			delete marker.remotes;
			marker.repoId = this.repo._id;
			marker.file = this.repoStreams[0].file;
			callback();
		});
	}

	// validate the response to the post request
	validateResponse (data) {
		// validate that the marker points to the file stream that was already created
		Assert(data.markers[0].fileStreamId === this.repoStreams[0]._id, 'returned stream should be the same as the existing file stream');
		super.validateResponse(data);
	}
}

module.exports = DuplicateFileStreamTest;
