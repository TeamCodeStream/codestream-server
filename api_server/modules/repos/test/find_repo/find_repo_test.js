// base class for find-repo units tests

'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var Assert = require('assert');
const RepoTestConstants = require('../repo_test_constants');

class FindRepoTest extends CodeStreamAPITest {

	get description () {
		return 'should return the expected repo when find a repo';
	}

	getExpectedFields () {
		return {
			repo: RepoTestConstants.EXPECTED_REPO_FIELDS,
			usernames: true
		};
	}

	dontWantToken () {
		// this is a no-auth request, no token is necessary
		return true;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createUsers,	// create some registered users
			this.createRepo,	// create a repo and team
			this.makePath		// make the path for the request test
		], callback);
	}

	// create some users for the test
	createUsers (callback) {
		this.userData = [];
		BoundAsync.times(
			this,
			3,
			this.createUser,
			callback
		);
	}

	// create a single user for the test
	createUser (n, callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.userData.push(response);
				callback();
			}
		);
	}

	// create a repo and team for the test
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				let url = encodeURIComponent(this.repo.url);
				let knownCommitHashes = encodeURIComponent(this.repo.knownCommitHashes[0]);
				this.queryData = { url, knownCommitHashes };	// we'll query for this repo using this data
				callback();
			},
			{
				withEmails: this.userData.slice(1).map(userData => userData.user.email),	// include the other users in the team
				withRandomEmails: 2,	// create a couple more users for good measure
				token: this.userData[0].accessToken,	// the first user will be the creator of the repo
				numKnownCommitHashes: this.numKnownCommitHashes	// can have multiple known commit hashes, as needed
			}
		);
	}

	// make the path we'll use to run the test request, with pre-established query parameters
	makePath (callback) {
		this.path = '/no-auth/find-repo?' +
			Object.keys(this.queryData).map(key => `${key}=${this.queryData[key]}`).join('&');
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		this.validateMatchingObject(this.repo._id, data.repo, 'repo');	// validate we got the expected repo
		this.validateSanitized(data.repo, RepoTestConstants.UNSANITIZED_ATTRIBUTES);	// make sure there are no attributes we don't want clients to see
		this.validateUsernames(data);	// validate we got a set of usernames with the request, this tells us which usernames the user can't take
	}

	// validate that the usernames we got in the request response match the users in the team
	validateUsernames (data) {
		let usernames = this.userData.map(userData => userData.user.username);
		usernames.sort();
		let gotUsernames = data.usernames;
		Assert(gotUsernames, 'got no usernames');
		gotUsernames.sort();
		Assert.deepEqual(usernames, gotUsernames, 'received usernames don\'t match');
	}
}

module.exports = FindRepoTest;
