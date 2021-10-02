'use strict';

const CodeErrorReplyTest = require('./code_error_reply_test');
const RandomString = require('randomstring');

class CodeErrorReplyToReplyTest extends CodeErrorReplyTest {

	get description () {
		return 'should be ok to reply to a reply to a code error';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.expectedSeqNum = 3;
			this.expectedStreamVersion = 3;
			callback();
		});
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			const data = this.getReplyData();
			this.doApiRequest(
				{
					method: 'post',
					path: '/posts',
					data,
					token: this.users[0].accessToken
				},
				(error, response) => {
					if (error) { return callback(error); }
					this.data.parentPostId = response.post.id;
					callback();
				}
			);
		});
	}


	getReplyData () {
		return {
			streamId: this.postData[0].codeError.streamId,
			parentPostId: this.postData[0].post.id,
			text: RandomString.generate(100)
		};
	}
}

module.exports = CodeErrorReplyToReplyTest;
