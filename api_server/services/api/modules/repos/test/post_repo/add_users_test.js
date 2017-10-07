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
		Bound_Async.series(this, [
			this.create_other_users,
			super.before
		], callback);
	}

	create_other_users (callback) {
		this.team_emails = [this.current_user.emails[0]];
		for (let i = 0; i < 3; i++) {
			this.team_emails.push(this.user_factory.random_email());
		}
		this.repo_options = {
			with_emails: this.team_emails
		};
		callback();
	}

	validate_response (data) {
console.warn('data', data);
		Assert(data.users instanceof Array, 'no users array returned');
		data.users.forEach(user => {
			Assert(this.team_emails.indexOf(user.emails[0]) !== -1, `got unexpected email ${user.emails[0]}`);
			Assert(user.team_ids.indexOf(data.repo.team_id) !== -1, `user ${user.emails[0]} not a member of the team for the repo`);
			this.validate_sanitized(user, Repo_Test_Constants.UNSANITIZED_USER_ATTRIBUTES);
		});
		super.validate_response(data);
	}
}

module.exports = Add_Users_Test;
