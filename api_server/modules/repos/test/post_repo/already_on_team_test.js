'use strict';

var PostRepoTest = require('./post_repo_test');

class AlreadyOnTeamTest extends PostRepoTest {

	constructor (options) {
		super(options);
		this.testOptions = {
			wantOtherUser: true,
			teamNotRequired: true,
			wantOtherRepo: true,
			wantRandomEmails: true
		};
	}

	get description () {
		return 'should return the new repo when trying to add a repo to an existing team that the user is already on';
	}

	createOtherRepo (callback) {
		this.otherRepoOptions = {
			withEmails: this.teamEmails,
			withUsers: this.teamUsers,
			token: this.otherUserData.accessToken
		};
		if (!this.testOptions.dontIncludeCurrentUser) {
			this.otherRepoOptions.withEmails.push(this.currentUser.email);
		}
		super.createOtherRepo(error => {
			if (error) { return callback(error); }
			this.repoOptions.teamId = this.existingRepo.teamId;
			this.teamEmails = [];
			this.teamUsers = [];
			callback();
		});
	}
}

module.exports = AlreadyOnTeamTest;
