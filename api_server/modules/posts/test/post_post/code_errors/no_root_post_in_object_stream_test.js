'use strict';

const CodeErrorReplyTest = require('./code_error_reply_test');

class NoRootPostInObjectStreamTest extends CodeErrorReplyTest {

	get description () {
		return 'should return an error when trying to post a non-reply to an object stream';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'cannot create non-reply in object stream'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			delete this.data.parentPostId;
			callback();
		});
	}

}

module.exports = NoRootPostInObjectStreamTest;
