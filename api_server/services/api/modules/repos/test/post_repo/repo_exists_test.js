'use strict';

var Already_Have_Repo_Test = require('./already_have_repo_test');

class Repo_Exists_Test extends Already_Have_Repo_Test {

	constructor (options) {
		super(options);
		this.test_options.want_other_user = true;
		this.test_options.want_random_emails = true;
	}

	get_description () {
		return 'should return the repo when trying to create a repo that already exists and the user is already on the team';
	}

	create_other_repo (callback) {
		this.other_repo_options = {
			with_emails: this.team_emails,
			token: this.other_user_data.access_token
		};
		if (!this.test_options.dont_include_current_user) {
			this.other_repo_options.with_emails.push(this.current_user.emails[0]);
		}
		super.create_other_repo(error => {
			if (error) { return callback(error); }
			this.data = {
				url: this.existing_repo.url,
				first_commit_sha: this.existing_repo.first_commit_sha
			};
			this.team_emails = [];
			callback();
		});
	}
}

module.exports = Repo_Exists_Test;
