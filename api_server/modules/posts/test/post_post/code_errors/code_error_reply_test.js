'use strict';

const PostReplyTest = require('../post_reply_test');

class CodeErrorReplyTest extends PostReplyTest {

	get description () {
		return 'should be ok to reply to a code error';
	}

	setTestOptions (callback) {
		this.expectedStreamVersion = 2;
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				creatorIndex: 1,
				wantCodeError: true
			});
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.data.streamId = this.postData[0].codeError.streamId;
			this.expectedStreamId = this.postData[0].codeError.streamId;
			delete this.data.codeError;
			callback();
		});
	}
}

module.exports = CodeErrorReplyTest;
