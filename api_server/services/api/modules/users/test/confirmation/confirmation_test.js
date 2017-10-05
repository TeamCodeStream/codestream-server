'use strict';

var Assert = require('assert');
var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');
var User_Test_Constants = require('../user_test_constants');

const DESCRIPTION = 'should return valid user data and an access token when confirming a registration';

class Confirmation_Test extends CodeStream_API_Test {

	get_description () {
		return DESCRIPTION;
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/no-auth/confirm';
	}

	get_expected_fields () {
		return User_Test_Constants.EXPECTED_LOGIN_RESPONSE;
	}

	dont_want_token () {
		return true;
	}

	before (callback) {
		this.user_factory.register_random_user((error, data) => {
			if (error) { return callback(error); }
			this.data = {
				user_id: data.user._id,
				email: data.user.emails[0],
				confirmation_code: data.user.confirmation_code
			};
			callback();
		}, this.user_options || {});
	}

	validate_response (data) {
		var user = data.user;
		var errors = [];
		var result = (
			((
				user.emails instanceof Array &&
				user.emails.length === 1 &&
				user.emails[0] === this.data.email
			) || errors.push('incorrect emails')) &&
			((user._id === this.data.user_id) || errors.push('incorrect user id'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		this.validate_sanitized(user, User_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Confirmation_Test;
