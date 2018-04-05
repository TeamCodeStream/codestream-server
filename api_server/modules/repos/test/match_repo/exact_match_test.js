'use strict';

const MatchRepoTest = require('./match_repo_test');
const RepoTestConstants = require('../repo_test_constants');
const Assert = require('assert');

class ExactMatchTest extends MatchRepoTest {

	constructor (options) {
		super(options);
		this.wantExactMatch = true;
		this.matches = [1];
	}

	get description () {
		return 'should return the repo info with usernames when an exact match to the repo is found';
	}

	// validate the response to the test request
	validateResponse (data) {
		const repo = this.repos[this.matches[0]];
		this.validateMatchingObject(repo._id, data.repo, 'repo');	// validate we got the expected repo
		this.validateSanitized(repo, RepoTestConstants.UNSANITIZED_ATTRIBUTES);	// make sure there are no attributes we don't want clients to see
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

module.exports = ExactMatchTest;
