'use strict';

const PostReplyTest = require('../post_reply_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class CodeErrorNumRepliesTest extends PostReplyTest {

	constructor (options) {
		super(options);
		this.expectedSeqNum = 3;
		this.expectedStreamVersion = 4;
	}

	get description () {
		return 'parent post\'s code error should get its numReplies attribute incremented when a reply is created for a post with a code error';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			Object.assign(this.postOptions, {
				wantCodeError: true
			});
			callback();
		});
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
				Assert.equal(response.codeError.numReplies, 1, 'numReplies should be 1');
				callback();
			}
		);
	}
}

module.exports = CodeErrorNumRepliesTest;
