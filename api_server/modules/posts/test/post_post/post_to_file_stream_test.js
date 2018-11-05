'use strict';

const PostPostTest = require('./post_post_test');

class PostToFileStreamTest extends PostPostTest {

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			this.streamOptions.type = 'file';
			callback();
		});
	}

	get description () {
		return 'should return an error when attempting to create a post in a file stream (this is no longer supported)';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'can not post to a file stream'
		};
	}
}

module.exports = PostToFileStreamTest;
