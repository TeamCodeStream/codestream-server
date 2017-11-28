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

	makePostOptions (callback) {
		super.makePostOptions(() => {
			this.postOptions.wantCodeBlocks = 1;
			callback();
		});
	}
}

module.exports = CodeBlockForBadStreamTypeTest;
