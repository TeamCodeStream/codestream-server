'use strict';

const CodeErrorReplyToAttachedCodemarkTest = require('./code_error_reply_to_attached_codemark_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class CodeErrorReplyToAttachedCodemarkNumRepliesTest extends CodeErrorReplyToAttachedCodemarkTest {

	get description () {
		return 'grandparent post\'s code error should get its numReplies attribute incremented when a reply is created for a codemark which is itself a reply to a code error';
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			super.run,	// this posts the reply and checks the result, but then...
			this.checkCodeError	// ...we'll check the code error
		], callback);
	}

	// check the code error associated with the parent post
	checkCodeError (callback) {
		// get the code error
		this.doApiRequest(
			{
				method: 'get',
				path: '/code-errors/' + this.postData[0].codeError.id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				// confirm the numReplies attribute has been incremented
				Assert.equal(response.codeError.numReplies, 2, 'numReplies should be 2');
				callback();
			}
		);
	}
}

module.exports = CodeErrorReplyToAttachedCodemarkNumRepliesTest;
