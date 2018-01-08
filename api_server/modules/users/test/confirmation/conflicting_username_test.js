'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');

class ConflictingUsernameTest extends CodeStreamAPITest {

	get description () {
		return 'should return an error when attempting to confirm a user with a username that is already taken on the team';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/no-auth/confirm';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1000',
		};
	}

	dontWantToken () {
		return true;
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRepo,
			this.registerUser
		], callback);
	}

	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.otherUserData = response;
				callback();
			}
		);
	}

	createRepo (callback) {
		this.email = this.userFactory.randomEmail();
		this.repoFactory.createRandomRepo(
			error => {
				if (error) { return callback(error); }
				callback();
			},
			{
				withEmails: [this.email],
				token: this.otherUserData.accessToken
			}
		);
	}

	registerUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/register',
				data: {
					email: this.email,
					username: 'someuser',
					password: 'blahblahblah',
					_confirmationCheat: SecretsConfig.confirmationCheat,	// gives us the confirmation code in the response
					_forceConfirmation: true	// overrides developer environment, where confirmation might be turned off
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.data = {
					userId: response.user._id,
					email: this.email,
					username: this.otherUserData.user.username,
					password: 'blahblahblah',
					confirmationCode: response.user.confirmationCode
				};
				callback();
			}
		);
	}
}

module.exports = ConflictingUsernameTest;
