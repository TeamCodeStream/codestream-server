'use strict';

const CodeErrorReplyTest = require('./code_error_reply_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class FollowCodeErrorWhenMentionedTest extends CodeErrorReplyTest {

	get description () {
		return 'when a reply to a code error mentions a user, the mentioned user should be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.mentionedUserIds = [this.users[1].user.id];
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
				// confirm the correct followers
				const followerIds = response.codeError.followerIds;
				followerIds.sort();
				const expectedFollowerIds = [this.currentUser.user.id, this.users[1].user.id];
				expectedFollowerIds.sort();
				Assert.deepStrictEqual(followerIds, expectedFollowerIds, 'incorrect followers');
				callback();
			}
		);
	}

}

module.exports = FollowCodeErrorWhenMentionedTest;
