'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const Repo_Test_Constants = require('../repo_test_constants');

class Get_Repos_Test extends CodeStream_API_Test {

	before (callback) {
		Bound_Async.series(this, [
			this.create_random_repo_by_me,
			this.create_other_user,
			this.create_random_repos_with_me,
			this.create_random_repo_without_me,
			this.set_path
		], callback);
	}

	create_random_repo_by_me (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.my_repo = response.repo;
				this.my_repo = response.repo;
				callback();
			},
			{
				with_random_emails: 2,
				token: this.token
			}
		);
	}

	create_other_user (callback) {
		this.user_factory.create_random_user(
			(error, response) => {
				if (error) { return callback(error); }
				this.other_user_data = response;
				callback();
			}
		);
	}

	create_random_repos_with_me (callback) {
		this.other_repos = [];
		Bound_Async.timesSeries(
			this,
			2,
			this.create_random_repos_in_team_with_me,
			callback
		);
	}

	create_random_repos_in_team_with_me (n, callback) {
		Bound_Async.series(this, [
			this.create_random_repo_with_me,
			this.create_random_repo_with_me_in_same_team
		], callback);
	}

	create_random_repo_with_me (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.other_repos.push(response.repo);
				this.last_team_id = response.repo.team_id;
				callback();
			},
			{
				with_random_emails: 2,
				with_emails: [this.current_user.email],
				token: this.other_user_data.access_token
			}
		);
	}

	create_random_repo_with_me_in_same_team (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.other_repos.push(response.repo);
				callback();
			},
			{
				team_id: this.last_team_id,
				with_random_emails: 2,
				with_emails: [this.current_user.email],
				token: this.other_user_data.access_token
			}
		);
	}

	create_random_repo_without_me (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.foreign_repo = response.repo;
				this.foreign_repo = response.repo;
				callback();
			},
			{
				with_random_emails: 2,
				token: this.other_user_data.access_token
			}
		);
	}

	validate_response (data) {
		this.validate_sanitized_objects(data.repos, Repo_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Get_Repos_Test;
