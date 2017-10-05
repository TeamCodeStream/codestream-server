'use strict';

var Assert = require('assert');
var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');
var User_Test_Constants = require('../user_test_constants');

const DESCRIPTION = 'should return valid user when doing login';

class Login_Test extends CodeStream_API_Test {

	get_description () {
		return DESCRIPTION;
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/no-auth/login';
	}

	get_expected_fields () {
		return User_Test_Constants.EXPECTED_LOGIN_RESPONSE;
	}

	dont_want_token () {
		return true;
	}

	before (callback) {
		this.user_data = this.user_factory.get_random_user_data();
		this.user_factory.create_user(this.user_data, (error, user_data) => {
			if (error) { return callback(error); }
			this.user = user_data.user;
			this.data = {
				email: this.user.emails[0],
				password: this.user_data.password
			};
			callback();
		});
	}

	validate_response (data) {
		Assert(data.user.emails instanceof Array && data.user.emails.length > 0, 'emails is not an array');
		Assert(data.user.emails[0] === this.data.email, 'email doesn\'t match');
		this.validate_sanitized(data.user, User_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Login_Test;
