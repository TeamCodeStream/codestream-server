'use strict';

var AlreadyHaveRepoTest = require('./already_have_repo_test');

class RepoExistsTest extends AlreadyHaveRepoTest {

	constructor (options) {
		super(options);
		this.testOptions.wantOtherUser = true;	// have a different user create the repo
		this.testOptions.wantRandomEmails = true;	// create some additional users on the team
	}

	get description () {
		return 'should return the repo when trying to create a repo that already exists and the user is already on the team';
	}

	// create a repo before the actual test, this is the repo that will "already exist"
	createOtherRepo (callback) {
		this.otherRepoOptions = {
			withEmails: this.teamEmails,
			withUsers: this.teamUsers,
			token: this.otherUserData.accessToken	// the "second" user creates the repo and team
		};
		if (!this.testOptions.dontIncludeCurrentUser) {
			// unless otherwise specified, include the "current" user in the team created
			this.otherRepoOptions.withEmails.push(this.currentUser.email);
		}
		// create the initial repo, we'll use its attributes in trying to "create" the (duplicate) repo for the test
		super.createOtherRepo(error => {
			if (error) { return callback(error); }
			this.data = {
				url: this.existingRepo.url,
				knownCommitHashes: [this.existingRepo.knownCommitHashes[0]]
			};
			this.teamEmails = [];
			this.teamUsers = [];
			this.teamData = this.existingTeam;
			this.teamCreator = this.otherUserData.user;
			callback();
		});
	}
}

module.exports = RepoExistsTest;
