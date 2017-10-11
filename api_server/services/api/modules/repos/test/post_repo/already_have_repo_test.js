'use strict';

var Post_Repo_Test = require('./post_repo_test');
var Assert = require('assert');

class Already_Have_Repo_Test extends Post_Repo_Test {

	constructor (options) {
		super(options);
		this.test_options.want_other_repo = true;
		this.test_options.team_not_required = true;
	}

	get_description () {
		return 'should return the repo when trying to create a repo that the user already created';
	}

	make_repo_data (callback) {
		this.data = {
			url: this.existing_repo.url,
			first_commit_sha: this.existing_repo.first_commit_sha
		};
		if (this.team_emails.length > 0) {
			this.data.emails = this.team_emails;
		}
		callback();
	}

	validate_response (data) {
		Assert(data.repo._id === this.existing_repo._id, 'repo returned isn\'t the one created');
		super.validate_response(data);
	}
}

module.exports = Already_Have_Repo_Test;
