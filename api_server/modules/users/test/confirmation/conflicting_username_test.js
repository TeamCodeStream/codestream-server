'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');
//const ApiConfig = require(process.env.CS_API_TOP + '/config/api.js');

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
		return true;	// don't need a registered user with a token for this test
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create a registered user
			this.createRepo,		// have that user create a repo, which creates a team
			this.registerUser		// register a user, we'll try to confirm with the same username as the registered user we created
		], callback);
	}

	// create a registered user (with a username, to trigger the conflict)
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a repo (which creates a team)
	createRepo (callback) {
		// generate a random email, and add that random email when we create the team, but they don't have a username yet
		this.email = this.userFactory.randomEmail();
		this.repoFactory.createRandomRepo(
			error => {
				if (error) { return callback(error); }
				callback();
			},
			{
				withEmails: [this.email],	// add an unregistered user to the team
				token: this.otherUserData.accessToken	// the registered user creates the repo and team
			}
		);
	}

	// register the user we created with the random email, without confirming,
	// but we'll give this user the same username as the registered user when we confirm
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
					_forceConfirmation: true,	// overrides developer environment, where confirmation might be turned off
//					betaCode: ApiConfig.testBetaCode	// overrides needing a true beta code
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.data = {
					userId: response.user._id,
					email: this.email,
					username: this.otherUserData.user.username,	// same username as the registered user, which triggers the conflict
					password: 'blahblahblah',	// required, whatever
					confirmationCode: response.user.confirmationCode
				};
				callback();
			}
		);
	}
}

module.exports = ConflictingUsernameTest;
