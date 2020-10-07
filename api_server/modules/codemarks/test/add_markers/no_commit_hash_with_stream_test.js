'use strict';

const AddMarkersTest = require('./add_markers_test');

class NoCommitHashWithStreamTest extends AddMarkersTest {

	get description () {
		return 'should return an error when attempting to add markers to a codemark but not providing a commit hash, when a stream is also specified';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'commitHash must be provided for markers attached to a stream'
		};
	}

	// form the data to use in trying to add the markers
	makeTestData (callback) {
		// remove the commit hash from the data to use, but supply a file and remotes,
		// meaning to create the stream on the fly
		super.makeTestData(() => {
			const marker = this.data.markers[0];
			delete marker.commitHash;
			marker.file = this.streamFactory.randomFile();
			marker.remotes = [this.repoFactory.randomUrl()];
			callback();
		});
	}
}

module.exports = NoCommitHashWithStreamTest;
