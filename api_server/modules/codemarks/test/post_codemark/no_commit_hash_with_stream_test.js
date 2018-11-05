'use strict';

const MarkerTest = require('./marker_test');

class NoCommitHashWithStreamTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create an codemark with a marker but not providing a commit hash, when a stream is also specified';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'commitHash must be provided for markers attached to a stream'
		};
	}

	// form the data to use in trying to create the codemark
	makeCodeMarkData (callback) {
		// remove the commit hash from the data to use in creating the codemark, but supply a file and remotes,
		// meaning to create the stream on the fly
		super.makeCodeMarkData(() => {
			const marker = this.data.markers[0];
			delete marker.commitHash;
			marker.file = this.streamFactory.randomFile();
			marker.remotes = [this.repoFactory.randomUrl()];
			callback();
		});
	}
}

module.exports = NoCommitHashWithStreamTest;
