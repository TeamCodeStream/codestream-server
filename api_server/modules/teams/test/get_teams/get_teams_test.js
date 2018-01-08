'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const TeamTestConstants = require('../team_test_constants');

class GetTeamsTest extends CodeStreamAPITest {

	before (callback) {
		BoundAsync.series(this, [
			this.createRandomRepoByMe,
			this.createOtherUser,
			this.createRandomReposWithMe,
			this.createRandomRepoWithoutMe,
			this.setPath
		], callback);
	}

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
				withRandomEmails: 2,
				token: this.token
			}
		);
	}

	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

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

	createRandomRepoWithMe (n, callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherRepos.push(response.repo);
				this.otherTeams.push(response.team);
				callback();
			},
			{
				withRandomEmails: 2,
				withEmails: [this.currentUser.email],
				token: this.otherUserData.accessToken
			}
		);
	}

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
				withRandomEmails: 2,
				token: this.otherUserData.accessToken
			}
		);
	}

	validateResponse (data) {
		this.validateSanitizedObjects(data.teams, TeamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetTeamsTest;
