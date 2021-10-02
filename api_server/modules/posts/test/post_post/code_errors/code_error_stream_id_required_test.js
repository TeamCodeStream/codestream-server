'use strict';

const CodeErrorReplyTest = require('./code_error_reply_test');

class CodeErrorStreamIdRequiredTest extends CodeErrorReplyTest {

	get description () {
		return `should return an error when attempting to create a reply to a code error with no streamId`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'streamId'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// delete the streamId attribute
		super.makePostData(() => {
			delete this.data.streamId;
			callback();
		});
	}
}

module.exports = CodeErrorStreamIdRequiredTest;
