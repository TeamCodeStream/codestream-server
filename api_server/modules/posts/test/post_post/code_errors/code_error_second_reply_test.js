'use strict';

const PostReplyTest = require('../post_reply_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class CodeErrorSecondReplyTest extends PostReplyTest {

	constructor (options) {
		super(options);
		this.expectedSeqNum = 3;
		this.expectedStreamVersion = 4;
	}
	
	get description () {
		return 'parent post and code error should get numReplies incremented when a second reply is created for that post';
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
			this.createSecondReply,	// create another reply
			this.checkCodeError	// ...we'll check the code error 
		], callback);
	}

	// create a second repy, to test that numReplies gets incremented even if hasReplies is set
	createSecondReply (callback) {
		this.postFactory.createRandomPost(
			callback,
			{
				streamId: this.teamStream.id,
				token: this.users[1].accessToken,
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
