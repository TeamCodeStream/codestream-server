'use strict';

const CodeErrorReplyTest = require('./code_error_reply_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class CodeErrorSecondReplyTest extends CodeErrorReplyTest {

	get description () {
		return 'parent post and code error should get numReplies incremented when a second reply is created for that post';
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			super.run,	// this posts the reply and checks the result, but then...
			this.createSecondReply,	// create another reply
			this.checkCodeError	// ...we'll check the code error 
		], callback);
	}

	// create a second repy, to test that numReplies gets incremented even if hasReplies is set
	createSecondReply (callback) {
		this.postFactory.createRandomPost(
			callback,
			{
				streamId: this.postData[0].codeError.streamId,
				token: this.users[0].accessToken,
				parentPostId: this.postData[0].post.id
			}
		);
	}

	// check the code error associated with the parent post
	checkCodeError (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/code-errors/' + this.postData[0].codeError.id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				// confirm the numReplies attribute has been incremented ... again
				Assert.equal(response.codeError.numReplies, 2, 'numReplies should be 2');
				callback();
			}
		);
	}
}

module.exports = CodeErrorSecondReplyTest;
