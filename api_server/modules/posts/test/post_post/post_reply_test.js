'use strict';

var PostToFileStreamTest = require('./post_to_file_stream_test');
var Assert = require('assert');

class PostReplyTest extends PostToFileStreamTest {

	constructor (options) {
		super(options);
		this.testOptions.wantOtherPost = true;	// the other post will be the parent post to the reply
		this.testOptions.expectedSeqNum = 2;	// two posts in the stream, overrides the default of 1
	}

	get description () {
		return 'should return a valid post when creating a reply post in a file stream';
	}


	// form the data for the post we'll create in the test
	makePostData (callback) {
		// in the reply, we don't really want code blocks ... use the ID of the
		// "other post" we created as the parent
		delete this.postOptions.wantCodeBlocks;
		this.postOptions.parentPostId = this.otherPostData.post._id;
		super.makePostData(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we created a post that has the correct post as parent
		let post = data.post;
		Assert(post.parentPostId === this.data.parentPostId, 'parentPostId does not match the ID of the parent post');
		super.validateResponse(data);
	}
}

module.exports = PostReplyTest;
