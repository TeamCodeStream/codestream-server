'use strict';

const PostReplyTest = require('./post_reply_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class CodeMarkNumRepliesTest extends PostReplyTest {

	get description () {
		return 'parent post\'s codemark should get its numReplies attribute incremented when a reply is created for a post with an codemark';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.wantCodeMark = true;
			callback();
		});
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			super.run,	// this posts the reply and checks the result, but then...
			this.checkCodeMark	// ...we'll check the codemark
		], callback);
	}

	// check the codemark associated with the parent post
	checkCodeMark (callback) {
		// get the codemark
		this.doApiRequest(
			{
				method: 'get',
				path: '/codemarks/' + this.postData[0].codemark._id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				// confirm the numReplies attribute has been incremented
				Assert.equal(response.codemark.numReplies, 1, 'numReplies should be 1');
				callback();
			}
		);
	}
}

module.exports = CodeMarkNumRepliesTest;
