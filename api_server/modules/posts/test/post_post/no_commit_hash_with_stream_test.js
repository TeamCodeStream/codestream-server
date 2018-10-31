'use strict';

const MarkerFromDifferentStreamTest = require('./marker_from_different_stream_test');

class NoCommitHashWithStreamTest extends MarkerFromDifferentStreamTest {

	constructor (options) {
		options = Object.assign(options || {}, { streamType: 'channel' });
		super(options);
	}

	get description () {
		return 'should return an error when attempting to create a post with a marker but not providing a commit hash, when a stream is also specified';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'commitHash must be provided for markers attached to a stream'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// remove the commit hash from the data to use in creating the post
		super.makePostData(() => {
			delete this.data.commitHashWhenPosted;
			callback();
		});
	}
}

module.exports = NoCommitHashWithStreamTest;
