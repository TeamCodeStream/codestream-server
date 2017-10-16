'use strict';

var Assert = require('assert');
var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const User_Test_Constants = require('../user_test_constants');

class Confirmation_Test extends CodeStream_API_Test {

	get description () {
		return 'should return valid user data and an access token when confirming a registration';
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
		let user = data.user;
		let errors = [];
		let result = (
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
