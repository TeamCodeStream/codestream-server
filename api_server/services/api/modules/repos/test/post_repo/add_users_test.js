'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Post_Repo_Test = require('./post_repo_test');
var Assert = require('assert');
var Repo_Test_Constants = require('../repo_test_constants');

class Add_Users_Test extends Post_Repo_Test {

	get_description () {
		return 'should return the repo and users when creating a repo with emails representing new users';
	}

	before (callback) {
		this.team_emails = this.team_emails || [this.current_user.emails[0]];
		Bound_Async.series(this, [
			this.create_other_users,
			super.before
		], callback);
	}

	create_other_users (callback) {
		for (let i = 0; i < 3; i++) {
			this.team_emails.push(this.user_factory.random_email());
		}
		this.repo_options = {
			with_emails: this.team_emails
		};
		callback();
	}

	validate_response (data) {
		Assert(data.users instanceof Array, 'no users array returned');
		data.users.forEach(user => {
			Assert(this.team_emails.indexOf(user.emails[0]) !== -1, `got unexpected email ${user.emails[0]}`);
			Assert(user.team_ids.indexOf(data.repo.team_id) !== -1, `user ${user.emails[0]} doesn't have the team for the repo`);
			Assert(user.company_ids.indexOf(data.repo.company_id) !== -1, `user ${user.emails[0]} doesn't have the company for the repo`);
			Assert(data.team.member_ids.indexOf(user._id) !== -1, `user ${user.emails[0]} not a member of the team for the repo`);
			this.validate_sanitized(user, Repo_Test_Constants.UNSANITIZED_USER_ATTRIBUTES);
		});
		let added_user_ids = data.users.map(user => user._id);
		this.team_data.member_ids = [this.current_user._id, ...added_user_ids].sort();
		super.validate_response(data);
	}
}

module.exports = Add_Users_Test;
