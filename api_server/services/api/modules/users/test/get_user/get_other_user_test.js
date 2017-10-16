'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const User_Test_Constants = require('../user_test_constants');

class Get_Other_User_Test extends CodeStream_API_Test {

	get description () {
		return 'should return user when requesting someone else';
	}

	get_expected_fields () {
		return User_Test_Constants.EXPECTED_USER_RESPONSE;
	}

	before (callback) {
		this.user_factory.create_random_user((error, data) => {
			if (error) { return callback(error); }
			this.created_user = data.user;
			this.path = '/users/' + data.user._id;
			callback();
		});
	}

	validate_response (data) {
		this.validate_matching_object(this.created_user._id, data.user, 'user');
		this.validate_sanitized(data.user, User_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Get_Other_User_Test;
