'use strict';

var PostRepoTest = require('./post_repo_test');
var Assert = require('assert');

class AlreadyHaveRepoTest extends PostRepoTest {

	constructor (options) {
		super(options);
		this.testOptions.wantOtherRepo = true;	// create a repo before the actual test runs, trying to create the "same" repo
		this.testOptions.teamNotRequired = true;	// don't try to create a team on-the-fly with the test request
	}

	get description () {
		return 'should return the repo when trying to create a repo that the user already created';
	}

	// make data to use in the request
	makeRepoData (callback) {
		// use attributes of the repo we already created
		this.data = {
			url: this.existingRepo.url,
			firstCommitHash: this.existingRepo.firstCommitHash
		};
		// if we set up some users to add, add those to the request here
		if (this.teamEmails.length > 0) {
			this.data.emails = this.teamEmails;
		}
		if (this.teamUsers.length > 0) {
			this.data.users = this.teamUsers;
		}
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		// make sure got back the repo that already existed
		Assert(data.repo._id === this.existingRepo._id, 'repo returned isn\'t the one created');
		super.validateResponse(data);
	}
}

module.exports = AlreadyHaveRepoTest;
