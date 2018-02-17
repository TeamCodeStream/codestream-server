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
		return true;
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRepo
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
		let email = this.userFactory.randomEmail();
		this.repoFactory.createRandomRepo(
			error => {
				if (error) { return callback(error); }
				this.data = {
					email: email,
					username: this.otherUserData.user.username,
					password: 'blahblahblah',
//					betaCode: ApiConfig.testBetaCode	// overrides needing a true beta code
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
