'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const Repo_Test_Constants = require('../repo_test_constants');

class Get_Repo_Test extends CodeStream_API_Test {

	get_expected_fields () {
		return { repo: Repo_Test_Constants.EXPECTED_REPO_FIELDS };
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_random_repo_by_me,
			this.create_other_user,
			this.create_random_repo_with_me,
			this.set_path
		], callback);
	}

	create_random_repo_by_me (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
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

	create_random_repo_with_me (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.other_repo = response.repo;
				callback();
			},
			{
				with_random_emails: 2,
				with_emails: [this.current_user.email],
				token: this.other_user_data.access_token
			}
		);
	}

	validate_response (data) {
		this.validate_sanitized(data.repo, Repo_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Get_Repo_Test;
