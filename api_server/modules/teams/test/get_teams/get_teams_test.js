// provide a base class for most tests of the "GET /teams" request

'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const TeamTestConstants = require('../team_test_constants');

class GetTeamsTest extends CodeStreamAPITest {

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createRandomRepoByMe,	// have the current user create a repo (which creates a team)
			this.createOtherUser,		// create a second registered user
			this.createRandomReposWithMe,	// have the other user create a few repos (and therefore teams) with the current user included in the team
			this.createRandomRepoWithoutMe,	// have the other user create a repo (and therefore team) without the current user included in the team
			this.setPath					// set the path to use when issuing the test request
		], callback);
	}

	// have the current user create a repo (which creates a team)
	createRandomRepoByMe (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.myRepo = response.repo;
				this.myTeam = response.team;
				this.myUsers = response.users;
				callback();
			},
			{
				withRandomEmails: 2,	// add a few unregistered users for good meausre
				token: this.token 		// current user creates the repo and team
			}
		);
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

	// have the "other" user create a few repos (and teams) with the current user included in the teams
	createRandomReposWithMe (callback) {
		this.otherRepos = [];
		this.otherTeams = [];
		BoundAsync.timesSeries(
			this,
			2,
			this.createRandomRepoWithMe,
			callback
		);
	}

	// have the "other" user create a repo (and team) with the current user included in the team
	createRandomRepoWithMe (n, callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherRepos.push(response.repo);
				this.otherTeams.push(response.team);
				callback();
			},
			{
				withRandomEmails: 2,	// include a few unregistered users for good measure
				withEmails: [this.currentUser.email],	// include current user in the team
				token: this.otherUserData.accessToken	// "other" user creates the repo and team
			}
		);
	}

	// have the "other" user create a repo (and team) without the current user included in the team,
	// call this a "foreign" repo and team
	createRandomRepoWithoutMe (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.foreignRepo = response.repo;
				this.foreignTeam = response.team;
				this.foreignUsers = response.users;
				callback();
			},
			{
				withRandomEmails: 2,	// include a few unregistered users for good measure
				token: this.otherUserData.accessToken	// "other" user creates the repo and team
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that the teams we get back do not have attributes that clients shouldn't see
		this.validateSanitizedObjects(data.teams, TeamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetTeamsTest;
