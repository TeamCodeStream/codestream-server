'use strict';

var PutUserTest = require('./put_user_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class UsernameNotUniqueForSecondTeamTest extends PutUserTest {

	get description () {
		return 'should return an error when user is trying to update their username and it is not unique for a second team';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1000'
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// set up usual test conditions
			this.createThirdUser,	// add another registered user
			this.createSecondRepo	// create a second repo and a second team, with the third user on it
		], callback);
	}

	// create another registered user (in addition to the "current" user)
	createThirdUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.thirdUserData = response;
				this.data.username = this.thirdUserData.user.username;	// we'll try to change the username to this user's username
				callback();
			}
		);
	}

	// create a second repo to use for the test
	createSecondRepo (callback) {
		// this should put the current user on another team, and
		this.repoFactory.createRandomRepo(
			callback,
			{
				withEmails: [this.currentUser.email],	// include current user
				withRandomEmails: 1,					// another user for good measure
				token: this.thirdUserData.accessToken	// the "third user" is the repo and team creator
			}
		);
	}
}

module.exports = UsernameNotUniqueForSecondTeamTest;
