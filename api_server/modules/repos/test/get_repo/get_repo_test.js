'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RepoTestConstants = require('../repo_test_constants');

class GetRepoTest extends CodeStreamAPITest {

	getExpectedFields () {
		return { repo: RepoTestConstants.EXPECTED_REPO_FIELDS };
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createRandomRepoByMe,
			this.createOtherUser,
			this.createRandomRepo,
			this.setPath
		], callback);
	}

	createRandomRepoByMe (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.myRepo = response.repo;
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

	createRandomRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherRepo = response.repo;
				callback();
			},
			{
				withRandomEmails: 2,
				withEmails: this.withoutMe ? null : [this.currentUser.email],
				token: this.otherUserData.accessToken
			}
		);
	}

	validateResponse (data) {
		this.validateSanitized(data.repo, RepoTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetRepoTest;
