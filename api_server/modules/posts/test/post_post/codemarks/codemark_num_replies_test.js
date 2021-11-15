'use strict';

const PostReplyTest = require('../post_reply_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class CodemarkNumRepliesTest extends PostReplyTest {

	get description () {
		return 'parent post\'s codemark should get its numReplies attribute incremented when a reply is created for a post with an codemark';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.wantCodemark = true;
			callback();
		});
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			super.run,	// this posts the reply and checks the result, but then...
			this.checkCodemark	// ...we'll check the codemark
		], callback);
	}

	validateResponse (data) {
		const now = Date.now();
		const expectedCodemarks = [{
			id: this.postData[0].codemark.id,
			_id: this.postData[0].codemark._id, // DEPRECATE ME
			$set: {
				numReplies: 1,
				version: 2
			},
			$addToSet: {
				followerIds: [
					this.currentUser.user.id
				]
			},
			$version: {
				before: 1,
				after: 2
			}
		}];
		['modifiedAt', 'lastActivityAt', 'lastReplyAt'].forEach(attribute => {
			Assert(data.codemarks[0].$set[attribute] >= this.postCreatedAfter, `${attribute} not set to after post was created`);
			expectedCodemarks[0].$set[attribute] = data.codemarks[0].$set[attribute];
		});
		Assert.deepStrictEqual(data.codemarks, expectedCodemarks, 'updated codemarks are not correct');
		super.validateResponse(data);
	}

	// check the codemark associated with the parent post
	checkCodemark (callback) {
		// get the codemark
		this.doApiRequest(
			{
				method: 'get',
				path: '/codemarks/' + this.postData[0].codemark.id,
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

module.exports = CodemarkNumRepliesTest;
