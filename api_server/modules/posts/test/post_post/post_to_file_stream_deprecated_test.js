'use strict';

const PostPostTest = require('./post_post_test');

class PostToFileStreamTest extends PostPostTest {

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.type = 'file';
			this.repoOptions.creatorIndex = 1;
			//this.streamOptions.type = 'file';
			callback();
		});
	}

	get description () {
		return 'should return an error when attempting to create a post in a file stream (this is no longer supported)';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1016',
			reason: 'posts can only be created in the team stream or an object stream'
		};
	}
}

module.exports = PostToFileStreamTest;
