'use strict';

var AlreadyHaveRepoTest = require('./already_have_repo_test');

class RepoExistsTest extends AlreadyHaveRepoTest {

	constructor (options) {
		super(options);
		this.testOptions.wantOtherUser = true;
		this.testOptions.wantRandomEmails = true;
	}

	get description () {
		return 'should return the repo when trying to create a repo that already exists and the user is already on the team';
	}

	createOtherRepo (callback) {
		this.otherRepoOptions = {
			withEmails: this.teamEmails,
			token: this.otherUserData.accessToken
		};
		if (!this.testOptions.dontIncludeCurrentUser) {
			this.otherRepoOptions.withEmails.push(this.currentUser.email);
		}
		super.createOtherRepo(error => {
			if (error) { return callback(error); }
			this.data = {
				url: this.existingRepo.url,
				firstCommitSha: this.existingRepo.firstCommitSha
			};
			this.teamEmails = [];
			callback();
		});
	}
}

module.exports = RepoExistsTest;
