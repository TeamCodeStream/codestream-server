'use strict';

const PostMarkerTest = require('./post_marker_test');
const Assert = require('assert');

class StreamOnTheFlyTest extends PostMarkerTest {

	get description () {
		return 'should return a valid marker when creating a marker tied to a third-party post, creating a file stream on the fly';
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// delete the stream ID but substitute file and repo ID to create a new stream
		super.makeMarkerData(() => {
			delete this.data.streamId;
			this.data.file = this.streamFactory.randomFile();
			this.data.repoId = this.repo._id;
			callback();
		});
	}

	validateResponse (data) {
		const stream = data.stream;
		const expectedRepo = this.onTheFlyRepo || this.repo;
		Assert.equal(stream.file, this.data.file, 'file of created stream does not match the given file');
		Assert.equal(stream.repoId, expectedRepo._id, 'repoId of created stream does not match the repo');
		this.onTheFlyStream = stream;
		super.validateResponse(data);
	}
}

module.exports = StreamOnTheFlyTest;
