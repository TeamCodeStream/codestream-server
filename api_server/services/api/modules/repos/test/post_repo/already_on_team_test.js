'use strict';

var Post_Repo_Test = require('./post_repo_test');

class Already_On_Team_Test extends Post_Repo_Test {

	constructor (options) {
		super(options);
		this.test_options = {
			want_other_user: true,
			team_not_required: true,
			want_other_repo: true,
			want_random_emails: true
		};
	}

	get_description () {
		return 'should return the new repo when trying to add a repo to an existing team that the user is already on';
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
			this.repo_options.team_id = this.existing_repo.team_id;
			this.team_emails = [];
			callback();
		});
	}
}

module.exports = Already_On_Team_Test;
