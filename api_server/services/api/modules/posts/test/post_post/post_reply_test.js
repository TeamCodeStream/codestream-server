'use strict';

var PostToFileStreamTest = require('./post_to_file_stream_test');
var Assert = require('assert');

class PostReplyTest extends PostToFileStreamTest {

	constructor (options) {
		super(options);
		this.testOptions.wantOtherPost = true;
	}

	get description () {
		return 'should return a valid post when creating a reply post in a file stream';
	}

	makePostData (callback) {
		delete this.postOptions.wantCodeBlocks;
		this.postOptions.parentPostId = this.otherPostData.post._id;
		super.makePostData(callback);
	}

	validateResponse (data) {
		let post = data.post;
		Assert(post.parentPostId === this.data.parentPostId, 'parentPostId does not match the ID of the parent post');
		super.validateResponse(data);
	}
}

module.exports = PostReplyTest;
