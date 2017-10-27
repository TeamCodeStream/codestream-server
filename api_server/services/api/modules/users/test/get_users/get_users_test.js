'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const User_Test_Constants = require('../user_test_constants');

class Get_Users_Test extends CodeStream_API_Test {

	before (callback) {
		Bound_Async.series(this, [
			this.create_other_user,
			this.create_random_repo,
			this.set_path
		], callback);
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

	create_random_repo (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.users = response.users;
				callback();
			},
			{
				with_random_emails: 5,
				with_emails: [this.current_user.email],
				token: this.mine ? this.token : this.other_user_data.access_token
			}
		);
	}

	validate_response (data) {
		this.validate_matching_objects(this.my_users, data.users, 'users');
		this.validate_sanitized_objects(data.users, User_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Get_Users_Test;
