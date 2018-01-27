'use strict';

var PostRepoTest = require('./post_repo_test');

class AlreadyOnTeamTest extends PostRepoTest {

	constructor (options) {
		super(options);
		// set up test options used in PostRepoTest...
		this.testOptions = {
			wantOtherUser: true,	// create a second registered user
			teamNotRequired: true,	// don't include creating a team on-the-fly in the request
			wantOtherRepo: true,	// create a repo before the test runs, trying to create another repo
			wantRandomEmails: 2		// include some random unregistered users
		};
	}

	get description () {
		return 'should return the new repo when trying to add a repo to an existing team that the user is already on';
	}

	// override PostRepoTest to create another repo in the same team as the team that was already
	// created for the first repo
	createOtherRepo (callback) {
		this.otherRepoOptions = {
			withEmails: this.teamEmails,	// include all the users we already included in the team
			withUsers: this.teamUsers,		
			token: this.otherUserData.accessToken	// the "second" user will create this repo
		};
		if (!this.testOptions.dontIncludeCurrentUser) {	// include the "current" user only if needed for the test
			this.otherRepoOptions.withEmails.push(this.currentUser.email);
		}
		super.createOtherRepo(error => {
			if (error) { return callback(error); }
			this.repoOptions.teamId = this.existingRepo.teamId;	// use the same teamId as the team that was already created for the first repo
			this.teamEmails = [];	// don't add any additional users
			this.teamUsers = [];
			callback();
		});
	}
}

module.exports = AlreadyOnTeamTest;
