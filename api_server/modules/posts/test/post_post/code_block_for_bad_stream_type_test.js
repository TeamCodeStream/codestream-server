'use strict';

var PostPostTest = require('./post_post_test');

class CodeBlockForBadStreamTypeTest extends PostPostTest {

	get description () {
		return `should return an error when attempting to create a post with a code block element where the stream is of type ${this.streamType}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			reason: 'only file type streams can have code blocks'
		};
	}

	// form options to use in trying to create the post
	makePostOptions (callback) {
		super.makePostOptions(() => {
			this.postOptions.wantCodeBlocks = 1;	// want code blocks, but this will be a channel or direct stream (not allowed)
			callback();
		});
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// explicitly set the stream ID of the code block to the post stream, 
		// otherwise, the server tries to create a code block not connected to any stream
		super.makePostData(() => {
			this.data.codeBlocks[0].streamId = this.stream._id;
			callback();
		});
	}

}

module.exports = CodeBlockForBadStreamTypeTest;
