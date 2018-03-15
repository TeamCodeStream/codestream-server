'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
//const ApiConfig = require(process.env.CS_API_TOP + '/config/api.js');

class ConflictingUsernameTest extends CodeStreamAPITest {

	get description () {
		return 'should return an error when attempting to register a user with a username that is already taken on the team';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/no-auth/register';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1000',
		};
	}

	dontWantToken () {
		return true;	// we don't want a registered user for this test
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create a second registered user
			this.createRepo			// create a repo (and team)
		], callback);
	}

	// create a second registered user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a repo and team
	createRepo (callback) {
		// in creating the team, we'll add an (unregistered) user first, then
		// try to register that user using the username of the user who created
		// the team, leading to a conflict
		let email = this.userFactory.randomEmail();
		this.repoFactory.createRandomRepo(
			error => {
				if (error) { return callback(error); }
				// establish
				this.data = {
					email: email,
					username: this.otherUserData.user.username,	// borrow the 'other' user's username
					password: 'blahblahblah',
					// betaCode: ApiConfig.testBetaCode	// overrides needing a true beta code
				};
				callback();
			},
			{
				withEmails: [email],
				token: this.otherUserData.accessToken
			}
		);
	}
}

module.exports = ConflictingUsernameTest;
