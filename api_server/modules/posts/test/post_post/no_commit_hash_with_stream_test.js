'use strict';

const CodeMarkMarkertest = require('./codemark_marker_test');

class NoCommitHashWithStreamTest extends CodeMarkMarkertest {

	get description () {
		return 'should return an error when attempting to create a post and codemark with a marker but not providing a commit hash, when a stream is also specified';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'commitHash must be provided for markers attached to a stream'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// remove the commit hash from the data to use in creating the post, but supply a file and remotes,
		// meaning to create the stream on the fly
		super.makePostData(() => {
			const marker = this.data.codemark.markers[0];
			delete marker.commitHash;
			marker.file = this.streamFactory.randomFile();
			marker.remotes = [this.repoFactory.randomUrl()];
			callback();
		});
	}
}

module.exports = NoCommitHashWithStreamTest;
