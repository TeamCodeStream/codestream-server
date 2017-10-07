'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Post_Repo_Test = require('./post_repo_test');
var Assert = require('assert');

class On_Team_For_Existing_Repo_Test extends Post_Repo_Test {

	get_description () {
		return 'should return the repo when trying to create a repo that already exists and the user is already on the team';
	}

	before (callback) {
		this.team_not_required = true;
		this.not_created_by_me = true;
		Bound_Async.series(this, [
			super.before,
			this.create_other_users,
			this.create_repo
		], callback);
	}

	create_other_users (callback) {
		this.user_factory.create_random_users(3, (error, response) => {
			if (error) { return callback(error); }
			this.other_user_data = response;
			callback();
		});
	}

	create_repo (callback) {
		let emails = this.other_user_data.map(user_data => { return user_data.user.emails[0]; });
		emails.push(this.current_user.emails[0]);
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.existing_repo = response.repo;
				this.data = {
					url: this.existing_repo.url,
					first_commit_sha: this.existing_repo.first_commit_sha
				};
				callback();
			},
			{
				token: this.other_user_data[0].access_token,
				with_emails: emails
			}
		);
	}

	validate_response (data) {
		Assert(data.repo._id === this.existing_repo._id, 'repo returned isn\'t the one created');
		super.validate_response(data);
	}
}

module.exports = On_Team_For_Existing_Repo_Test;
