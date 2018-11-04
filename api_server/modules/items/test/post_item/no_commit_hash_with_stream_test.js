'use strict';

const MarkerTest = require('./marker_test');

class NoCommitHashWithStreamTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create an item with a marker but not providing a commit hash, when a stream is also specified';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'commitHash must be provided for markers attached to a stream'
		};
	}

	// form the data to use in trying to create the item
	makeItemData (callback) {
		// remove the commit hash from the data to use in creating the item, but supply a file and remotes,
		// meaning to create the stream on the fly
		super.makeItemData(() => {
			const marker = this.data.markers[0];
			delete marker.commitHash;
			marker.file = this.streamFactory.randomFile();
			marker.remotes = [this.repoFactory.randomUrl()];
			callback();
		});
	}
}

module.exports = NoCommitHashWithStreamTest;
