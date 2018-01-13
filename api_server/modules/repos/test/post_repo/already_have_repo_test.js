'use strict';

var PostRepoTest = require('./post_repo_test');
var Assert = require('assert');

class AlreadyHaveRepoTest extends PostRepoTest {

	constructor (options) {
		super(options);
		this.testOptions.wantOtherRepo = true;
		this.testOptions.teamNotRequired = true;
	}

	get description () {
		return 'should return the repo when trying to create a repo that the user already created';
	}

	makeRepoData (callback) {
		this.data = {
			url: this.existingRepo.url,
			firstCommitHash: this.existingRepo.firstCommitHash
		};
		if (this.teamEmails.length > 0) {
			this.data.emails = this.teamEmails;
		}
		if (this.teamUsers.length > 0) {
			this.data.users = this.teamUsers;
		}
		callback();
	}

	validateResponse (data) {
		Assert(data.repo._id === this.existingRepo._id, 'repo returned isn\'t the one created');
		super.validateResponse(data);
	}
}

module.exports = AlreadyHaveRepoTest;
