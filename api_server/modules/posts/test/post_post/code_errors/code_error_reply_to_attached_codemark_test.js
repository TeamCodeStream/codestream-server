'use strict';

const CodeErrorReplyWithCodemarkTest = require('./code_error_reply_with_codemark_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class CodeErrorReplyToAttachedCodemarkTest extends CodeErrorReplyWithCodemarkTest {

	get description () {
		return 'should be ok to reply to a codemark that is a reply to a code error';
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			super.run,	// this posts the codemark reply and checks the result, but then...
			this.createCodemarkReply	// create a reply to the codemark
		], callback);
	}

	validateResponse (data) {
		this.codemarkResponse = data;
		super.validateResponse(data);
	}

	createCodemarkReply (callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				Assert.equal(response.post.parentPostId, this.codemarkResponse.post.id, 'parentPostId of reply not equal to the codemark post');
				callback();
			},
			{
				streamId: this.codemarkResponse.post.streamId,
				parentPostId: this.codemarkResponse.post.id,
				token: this.users[0].accessToken
			}
		);
	}
}

module.exports = CodeErrorReplyToAttachedCodemarkTest;
