'use strict';

var ConfirmationTest = require('./confirmation_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var Assert = require('assert');

class InitialDataTest extends ConfirmationTest {

	get description () {
		return 'user should receive teams and repos with response to email confirmation';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// standard confirmation test set up
			this.createOtherUser,	// create a registered user
			this.createRepo 		// have that user create a repo (and a team)
		], callback);
	}

	// create a registered user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.otherUserData = response;
				callback();
			}
		);
	}

	// have the registered user create a repo, which creates a team ... the user to confirm
	// will be put on the team, so when they do confirm, they'll get the repo and team in the response
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				withEmails: [this.data.email],	// user to confirm is on this team
				token: this.otherUserData.accessToken	// the registered user creates the repo and team
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got the team and repo in the response
		Assert(data.teams.length === 1, 'no team in response');
		this.validateMatchingObject(this.team._id, data.teams[0], 'team');
		Assert(data.repos.length === 1, 'no repo in response');
		this.validateMatchingObject(this.repo._id, data.repos[0], 'repo');
		super.validateResponse(data);
	}
}

module.exports = InitialDataTest;
