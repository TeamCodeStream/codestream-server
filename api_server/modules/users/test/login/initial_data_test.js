'use strict';

var LoginTest = require('./login_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var Assert = require('assert');

class InitialDataTest extends LoginTest {

	get description () {
		return 'user should receive teams and repos with response to login';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// standard setup for login request test
			this.createOtherUser,	// create a second registered user
			this.createRepo			// create a repo and team (we want to see these returned with the login response)
		], callback);
	}

	// create a second registered user, who will create a repo and team
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a repo (and team)
	createRepo (callback) {
		this.email = this.userFactory.randomEmail();
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				this.users = response.users;
				callback();
			},
			{
				withEmails: [this.data.email],			// include current user
				token: this.otherUserData.accessToken	// "other" user creates the repo
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got the team and repo that were created
		Assert(data.teams.length === 1, 'no team in response');
		this.validateMatchingObject(this.team._id, data.teams[0], 'team');
		Assert(data.repos.length === 1, 'no repo in response');
		this.validateMatchingObject(this.repo._id, data.repos[0], 'repo');
		super.validateResponse(data);
	}
}

module.exports = InitialDataTest;
