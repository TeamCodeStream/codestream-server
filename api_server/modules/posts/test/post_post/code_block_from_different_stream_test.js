'use strict';

var PostPostTest = require('./post_post_test');
var Assert = require('assert');

class CodeBlockFromDifferentStreamTest extends PostPostTest {

	get description () {
		return `should return a valid post when creating a post in a ${this.streamType} stream referencing a code block from another stream`;
	}

	// make options to use in creating the stream for this post
	makeStreamOptions (callback) {
		super.makeStreamOptions(() => {
			// for file-type streams, we need the repo ID
			if (this.streamType === 'file') {
				this.streamOptions.repoId = this.repo._id;
			}
			callback();
		});
	}

	// form the data we'll use in creating the post
	makePostData (callback) {
		// create another file stream, we'll borrow the code block from this
		// stream when creating a post in the original stream for the test
		this.createOtherFileStream(error => {
			if (error) { return callback(error); }
			Object.assign(this.postOptions, {
				wantCodeBlocks: 1,
				codeBlockStreamId: this.otherFileStream._id	// overrides creating the code block in the same stream
			});
			super.makePostData(callback);
		});
	}

	// create a second file-type stream, the code-block will be from this stream,
	// even though the post is in another stream
	createOtherFileStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherFileStream = response.stream;
				callback();
			},
			{
				type: 'file',
				teamId: this.team._id,
				repoId: this.repo._id,
				token: this.otherUserData.accessToken	// the "other" user will create the stream
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that the marker for the code block points to the other stream,
		// but that the post points to the original stream created for the test
		let post = data.post;
		let marker = data.markers[0];
		Assert(marker.streamId === this.otherFileStream._id, 'streamId of marker does not match the other file stream ID');
		Assert(post.streamId !== marker.streamId, 'the streamId of the post and the streamId of the marker are the same');
		super.validateResponse(data);
	}
}

module.exports = CodeBlockFromDifferentStreamTest;
