'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const User_Test_Constants = require('../user_test_constants');

class Get_Invited_User_Test extends CodeStream_API_Test {

	get description () {
		return 'should return user when requesting someone else who is on one of my teams (from a repo i created)';
	}

	get_expected_fields () {
		return { user: User_Test_Constants.EXPECTED_UNREGISTERED_USER_FIELDS };
	}

	before (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.other_user = response.users[0];
				this.path = '/users/' + this.other_user._id;
				callback();
			},
			{
				with_random_emails: 2,
				token: this.token
			}
		);
	}

	validate_response (data) {
		this.validate_matching_object(this.other_user._id, data.user, 'user');
		this.validate_sanitized(data.user, User_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Get_Invited_User_Test;
