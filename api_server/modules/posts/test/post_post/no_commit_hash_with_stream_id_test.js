'use strict';

const CodeMarkMarkertest = require('./codemark_marker_test');

class NoCommitHashWithStreamIdTest extends CodeMarkMarkertest {

	constructor (options) {
		super(options);
		this.repoOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return an error when attempting to create a post and codemark with a marker but not providing a commit hash, when a stream ID is also specified';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'commitHash must be provided for markers attached to a stream'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// remove the commit hash from the data to use in creating the post, but keep the stream ID
		super.makePostData(() => {
			const marker = this.data.codemark.markers[0];
			delete marker.commitHash;
			callback();
		});
	}
}

module.exports = NoCommitHashWithStreamIdTest;
