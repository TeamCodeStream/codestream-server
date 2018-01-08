'use strict';

var PostToFileStreamTest = require('./post_to_file_stream_test');

class PostCodeToFileStreamTest extends PostToFileStreamTest {

	// make options to use when forming the data to use to create a post
	makePostOptions (callback) {
		super.makePostOptions(() => {
			this.postOptions.wantCodeBlocks = 1; // we want code blocks!
			callback();
		});
	}
}

module.exports = PostCodeToFileStreamTest;
