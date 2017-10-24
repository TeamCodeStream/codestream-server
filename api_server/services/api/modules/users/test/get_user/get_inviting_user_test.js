'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const User_Test_Constants = require('../user_test_constants');

class Get_Inviting_User_Test extends CodeStream_API_Test {

	get description () {
		return 'should return user when requesting someone else who is on one of my teams (from a repo they created)';
	}

	get_expected_fields () {
		return User_Test_Constants.EXPECTED_USER_RESPONSE;
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_other_user,
			this.create_random_repo
		], callback);
	}

	create_other_user (callback) {
		this.user_factory.create_random_user(
			(error, response) => {
				if (error) { return callback(error); }
				this.other_user_data = response;
				this.path = '/users/' + this.other_user_data.user._id;
				callback();
			}
		);
	}

	create_random_repo (callback) {
		this.repo_factory.create_random_repo(
			callback,
			{
				with_random_emails: 2,
				with_emails: [this.current_user.email],
				token: this.other_user_data.access_token
			}
		);
	}

	validate_response (data) {
		this.validate_matching_object(this.other_user_data.user._id, data.user, 'user');
		this.validate_sanitized(data.user, User_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Get_Inviting_User_Test;
