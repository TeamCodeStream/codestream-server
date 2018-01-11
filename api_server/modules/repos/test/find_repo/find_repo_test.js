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
		return true;
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createUsers,
			this.createRepo,
			this.makePath
		], callback);
	}

	createUsers (callback) {
		this.userData = [];
		BoundAsync.times(
			this,
			3,
			this.createUser,
			callback
		);
	}

	createUser (n, callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.userData.push(response);
				callback();
			}
		);
	}

	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				let url = encodeURIComponent(this.repo.url);
				let firstCommitHash = encodeURIComponent(this.repo.firstCommitHash);
				this.queryData = { url, firstCommitHash };
				callback();
			},
			{
				withEmails: this.userData.slice(1).map(userData => userData.user.email),
				withRandomEmails: 2,
				token: this.userData[0].accessToken
			}
		);
	}

	makePath (callback) {
		this.path = '/no-auth/find-repo?' +
			Object.keys(this.queryData).map(key => `${key}=${this.queryData[key]}`).join('&');
		callback();
	}

	validateResponse (data) {
		this.validateMatchingObject(this.repo._id, data.repo, 'repo');
		this.validateSanitized(data.repo, RepoTestConstants.UNSANITIZED_ATTRIBUTES);
		this.validateUsernames(data);
	}

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
