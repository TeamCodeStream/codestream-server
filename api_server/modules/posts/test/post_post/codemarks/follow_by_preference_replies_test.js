'use strict';

const CodemarkTest = require('./codemark_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class FollowByPreferenceRepliesTest extends CodemarkTest {

	get description () {
		return 'when a codemark is created and another user replies, and the replying user has a preference to follow codemarks they reply to, the replying user should be added as a follower';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				creatorIndex: 1,
				numPosts: 1,
				wantCodemark: true
			});
			callback();
		});
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			// test is not really to create the codemark, but to create the reply and then
			// test that the parent codemark gets the user added to its array of followers,
			// so we'll remove the codemark in the request data here, and instead make it 
			// a regular post as a reply
			delete this.data.codemark;
			this.data.parentPostId = this.postData[0].post.id;

			// then set the notification preference for the replying user 
			this.setNotificationPreference('involveMe', 0, callback);
		});
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			super.run,	// this posts the reply and checks the result, but then...
			this.checkParentPost	// ...we'll check the parent codemark as well
		], callback);
	}

	validateResponse () {
		// ignore validation of the normal test
	}

	// check the parent codemark for correct array of followers
	checkParentPost (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/codemarks/' + this.postData[0].codemark.id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert.deepEqual(response.codemark.followerIds, [this.users[1].user.id, this.currentUser.user.id]);
				callback();
			}
		);
	}
}

module.exports = FollowByPreferenceRepliesTest;
