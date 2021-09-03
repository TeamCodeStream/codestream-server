'use strict';

const CodeErrorTest = require('./code_error_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class NoFollowCodeErrorRepliesByPreferenceTest extends CodeErrorTest {

	get description () {
		return 'when a code error is created and another user replies, but the replying user has notification preferences turned off, the replying user should not be added as a follower';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			Object.assign(this.postOptions, {
				creatorIndex: 1,
				numPosts: 1,
				wantCodeError: true

			});
			callback();
		});
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			// test is not really to create the code error, but to create the reply and then
			// test that the parent code error gets the user added to its array of followers,
			// so we'll remove the code error in the request data here, and instead make it 
			// a regular post as a reply
			delete this.data.codeError;
			this.data.parentPostId = this.postData[0].post.id;

			// then set the notification preference for the replying user 
			this.setNotificationPreference('off', 0, callback);
		});
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			super.run,	// this posts the reply and checks the result, but then...
			this.checkParentPost	// ...we'll check the parent code error as well
		], callback);
	}

	validateResponse () {
		// ignore validation of the normal test
	}

	// check the parent code error for correct array of followers
	checkParentPost (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/code-errors/' + this.postData[0].codeError.id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert.deepEqual(response.codeError.followerIds, [this.users[1].user.id]);
				callback();
			}
		);
	}
}

module.exports = NoFollowCodeErrorRepliesByPreferenceTest;
