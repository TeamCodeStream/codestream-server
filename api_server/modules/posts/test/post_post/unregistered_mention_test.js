'use strict';

const PostPostTest = require('./post_post_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class UnregisteredMentionTest extends PostPostTest {

	get description () {
		return 'a mentioned unregistered user should get analytics related updates';
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			// add users to the mentionedUserIds array
			this.mentionedUser = this.users.find(user => !user.user.isRegistered).user;
			this.data.mentionedUserIds = [this.mentionedUser.id];
			callback();
		});
	}

	// actually run the test... here we override the base class test run, and
	// perform a follow-up fetch of the user object that should have been modified
	// by the mention
	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.fetchUser,
			this.verifyUserUpdate
		], callback);
	}

	// fetch the user's me-object after accepting
	fetchUser (callback) {
		if (!this.oneUserPerOrg) {
			return callback();
		}
		this.doApiRequest(
			{
				method: 'get',
				path: '/users/' + this.mentionedUser.id,
				token: this.token,
				requestOptions: {
					headers: {
						// use this cheat to fetch me-attributes, even though we're not fetching "me"
						'X-CS-Me-Cheat': this.apiConfig.sharedSecrets.confirmationCheat
					}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.meResponse = response;
				callback();
			}
		);
	}

	// verify that the mentioned user was properly updated by the mention
	verifyUserUpdate (callback) {
		const { user } = this.meResponse;
		Assert(user.internalMethod === 'mention_notification', 'internalMethod not correct');
		Assert(user.internalMethodDetail === this.currentUser.user.id, 'internalMethodDetail not set to post author');
		Assert(user.numMentions === 1, 'numMentions not set to 1');
		callback();
	}
}

module.exports = UnregisteredMentionTest;
