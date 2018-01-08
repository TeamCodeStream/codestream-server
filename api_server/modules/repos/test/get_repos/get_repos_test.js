'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const RepoTestConstants = require('../repo_test_constants');

class GetReposTest extends CodeStreamAPITest {

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRandomRepoByMe,
			this.createRandomReposInTeam,
			this.createRandomRepoInOtherTeam,
			this.setPath
		], callback);
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

	createRandomRepoByMe (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.myRepo = response.repo;
				this.myTeam = response.team;
				callback();
			},
			{
				withRandomEmails: 2,
				withEmails: [this.otherUserData.user.email],
				token: this.token
			}
		);
	}

	createRandomReposInTeam (callback) {
		this.otherRepos = [];
		BoundAsync.timesSeries(
			this,
			2,
			this.createRandomRepoInTeam,
			callback
		);
	}

	createRandomRepoInTeam (n, callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherRepos.push(response.repo);
				callback();
			},
			{
				withRandomEmails: 2,
				withEmails: [this.currentUser.email],
				teamId: this.myTeam._id,
				token: this.otherUserData.accessToken
			}
		);
	}

	createRandomRepoInOtherTeam (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.foreignRepo = response.repo;
				this.foreignTeam = response.team;
				callback();
			},
			{
				withRandomEmails: 2,
				token: this.otherUserData.accessToken
			}
		);
	}

	validateResponse (data) {
		this.validateMatchingObjects(this.myRepos, data.repos, 'repos');
		this.validateSanitizedObjects(data.repos, RepoTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetReposTest;
