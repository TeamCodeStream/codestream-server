'use strict';

var PostRepoTest = require('./post_repo_test');

class AddUsersTest extends PostRepoTest {

	constructor (options) {
		super(options);
		this.testOptions.wantRandomEmails = true;
	}

	get description () {
		return 'should return the repo and users when creating a repo with emails representing new users';
	}
}

module.exports = AddUsersTest;
