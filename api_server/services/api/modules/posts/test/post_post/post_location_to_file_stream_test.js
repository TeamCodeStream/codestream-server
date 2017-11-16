'use strict';

var PostToFileStreamTest = require('./post_to_file_stream_test');
var Assert = require('assert');

class PostLocationToFileStreamTest extends PostToFileStreamTest {

	get description () {
		return 'should return a valid post when creating a post with location info in a file stream';
	}

	makePostOptions (callback) {
		super.makePostOptions(() => {
			this.postOptions.wantLocation = true;
			callback();
		});
	}

	validateResponse (data) {
		let post = data.post;
		Assert.deepEqual(this.data.location, post.location, 'location does not match');
		Assert.deepEqual(this.data.replayInfo, post.replayInfo, 'replayInfo does not match');
		super.validateResponse(data);
	}
}

module.exports = PostLocationToFileStreamTest;
