'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RepoTestConstants = require('../repo_test_constants');

class GetReposTest extends CodeStreamAPITest {

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,				// create a second registered user
			this.createRandomRepoByMe,			// current user creates a repo and team
			this.createRandomReposInTeam,		// second user creates a few more repos in the team
			this.createRandomRepoInOtherTeam,	// second user creates a repo in another team (and i'm not included)
			this.setPath						// set the path for the test request
		], callback);
	}

	// create a second registered user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// current user creates a repo (and team)
	createRandomRepoByMe (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.myRepo = response.repo;
				this.myTeam = response.team;
				callback();
			},
			{
				withRandomEmails: 2,	// add a few other users for good measure
				withEmails: [this.otherUserData.user.email],	// include the "second" registered user
				token: this.token 		// current user creates the repo
			}
		);
	}

	// create a few other repos in the same team
	createRandomReposInTeam (callback) {
		this.otherRepos = [];
		BoundAsync.timesSeries(
			this,
			2,
			this.createRandomRepoInTeam,
			callback
		);
	}

	// create a single repo in the same team
	createRandomRepoInTeam (n, callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherRepos.push(response.repo);
				callback();
			},
			{
				withRandomEmails: 2,	// include a few other unregistered users
				withEmails: [this.currentUser.email],	// include the "current" user
				teamId: this.myTeam._id,				// same team as the first repo
				token: this.otherUserData.accessToken	// "second" user creates the repo
			}
		);
	}

	// create a repo in a different team, current user will not be included in this team
	createRandomRepoInOtherTeam (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.foreignRepo = response.repo;
				this.foreignTeam = response.team;
				callback();
			},
			{
				withRandomEmails: 2,	// include a few other unregistered users
				token: this.otherUserData.accessToken	// "second" user creates the repo and team, current user is not included
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate we got all the expected repos, and that no attributes were returned not suitable for clients
		this.validateMatchingObjects(this.myRepos, data.repos, 'repos');
		this.validateSanitizedObjects(data.repos, RepoTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetReposTest;
