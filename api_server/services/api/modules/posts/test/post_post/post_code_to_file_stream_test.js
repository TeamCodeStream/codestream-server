'use strict';

var PostToFileStreamTest = require('./post_to_file_stream_test');

class PostCodeToFileStreamTest extends PostToFileStreamTest {

	makePostOptions (callback) {
		super.makePostOptions(() => {
			this.postOptions.wantCodeBlocks = 1;
			callback();
		});
	}
}

module.exports = PostCodeToFileStreamTest;
