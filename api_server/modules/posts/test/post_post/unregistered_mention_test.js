'use strict';

var PostToFileStreamTest = require('./post_to_file_stream_test');
var Assert = require('assert');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var RandomString = require('randomstring');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

class UnregisteredMentionTest extends PostToFileStreamTest {

	get description () {
		return 'a mentioned unregistered user should get analytics related updates';
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			// add users to the mentionedUserIds array
			this.mentionedUser = this.users.find(user => !user.isRegistered);
			this.data.mentionedUserIds = [this.mentionedUser._id];
			callback();
		});
	}

	// actually run the test... here we override the base class test run, and
	// perform a follow-up fetch of the user object that should have been modified
	// by the mention
	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.registerUser,
			this.confirmUser,
			this.verifyUserUpdate
		], callback);
	}

	// register the mentioned user, since they were unregistered, and we need
	// an access token for them to get their me-object and verify
	registerUser (callback) {
		this.doApiRequest({
			method: 'post',
			path: '/no-auth/register',
			data: {
				email: this.mentionedUser.email,
				username: RandomString.generate(12),
				password: RandomString.generate(12),
				_confirmationCheat: SecretsConfig.confirmationCheat,	// gives us the confirmation code in the response
				_forceConfirmation: true								// this forces confirmation even if not enforced in environment
			}
		}, (error, response) => {
			if (error) { return callback(error); }
			this.registeredUser = response.user;
			callback();
		});
	}

	// confirm the mentioned user's registration
	confirmUser (callback) {
		this.doApiRequest({
			method: 'post',
			path: '/no-auth/confirm',
			data: {
				email: this.registeredUser.email,
				userId: this.registeredUser._id,
				confirmationCode: this.registeredUser.confirmationCode
			}
		}, (error, response) => {
			if (error) { return callback(error); }
			this.confirmedUser = response.user;
			callback();
		});
	}

	// verify that the mentioned user was properly updated by the mention
	verifyUserUpdate (callback) {
		const user = this.confirmedUser;
		Assert(user.internalMethod === 'mention_notification', 'internalMethod not correct');
		Assert(user.internalMethodDetail === this.currentUser._id, 'internalMethodDetail not set to post author');
		Assert(user.numMentions === 1, 'numMentions not set to 1');
		callback();
	}
}

module.exports = UnregisteredMentionTest;
