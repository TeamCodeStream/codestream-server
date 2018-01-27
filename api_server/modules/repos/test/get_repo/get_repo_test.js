'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RepoTestConstants = require('../repo_test_constants');

class GetRepoTest extends CodeStreamAPITest {

	getExpectedFields () {
		return { repo: RepoTestConstants.EXPECTED_REPO_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createRandomRepoByMe,	// current user creates a repo and team
			this.createOtherUser,		// create a second registered user
			this.createRandomRepo,		// second user creates another repo and team, possibly without the current user, as needed
			this.setPath				// set the path to use for the test request
		], callback);
	}

	// the current user creates a repo and team
	createRandomRepoByMe (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.myRepo = response.repo;
				callback();
			},
			{
				withRandomEmails: 2,	// throw in a couple extra users
				token: this.token 		// current user's access token, they become the creator of the repo and team
			}
		);
	}

	// create another registered user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// have the second user create their own repo and team, which the current user may or not be on, depending on the test
	createRandomRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherRepo = response.repo;
				callback();
			},
			{
				withRandomEmails: 2,	// throw in a couple extra users
				withEmails: this.withoutMe ? null : [this.currentUser.email],	// include the current user or not, depending on the test
				token: this.otherUserData.accessToken	// the "second" user creates the repo
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// make sure we didn't get attributes not suitable for the client 
		this.validateSanitized(data.repo, RepoTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetRepoTest;
