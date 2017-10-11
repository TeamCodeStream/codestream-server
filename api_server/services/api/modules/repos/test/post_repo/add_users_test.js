'use strict';

var Post_Repo_Test = require('./post_repo_test');

class Add_Users_Test extends Post_Repo_Test {

	constructor (options) {
		super(options);
		this.test_options.want_random_emails = true;
	}

	get description () {
		return 'should return the repo and users when creating a repo with emails representing new users';
	}
}

module.exports = Add_Users_Test;
