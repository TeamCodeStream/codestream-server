'use strict';

var PostRepoTest = require('./post_repo_test');

class AddUsersTest extends PostRepoTest {

	constructor (options) {
		super(options);
		this.testOptions.wantRandomEmails = true;	// add a few random emails to the team we create, we should see those users in the response
	}

	get description () {
		return 'should return the repo and users when creating a repo with emails representing new users';
	}
}

module.exports = AddUsersTest;
