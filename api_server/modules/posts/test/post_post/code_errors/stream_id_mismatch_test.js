'use strict';

const CodeErrorReplyTest = require('./code_error_reply_test');

class StreamIdMismatchTest extends CodeErrorReplyTest {

	get description () {
		return `should return an error when attempting to create a reply to a code error but providing a stream ID that does not match the code error`;
	}

	getExpectedError () {
		return {
			code: 'POST-1006'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.streamId = this.teamStream.id;
			callback();
		});
	}
}

module.exports = StreamIdMismatchTest;
