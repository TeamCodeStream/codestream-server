'use strict';

const CodeErrorReplyTest = require('./code_error_reply_test');

class CodeErrorReplyACLTest extends CodeErrorReplyTest {

	get description () {
		return 'should return an error when attempting to create a reply to a code error that i am not following';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			callback();
		});
	}
}

module.exports = CodeErrorReplyACLTest;
