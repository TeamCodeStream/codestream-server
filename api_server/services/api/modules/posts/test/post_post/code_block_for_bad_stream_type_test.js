'use strict';

var PostPostTest = require('./post_post_test');

class CodeBlockForBadStreamTypeTest extends PostPostTest {

	get description () {
		return `should return an error when attempting to create a post with a code block element where the stream is of type ${this.streamType}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1007',
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
}

module.exports = CodeBlockForBadStreamTypeTest;
