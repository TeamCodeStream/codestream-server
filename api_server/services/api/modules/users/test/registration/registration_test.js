'use strict';

var Assert = require('assert');
var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');
var User_Test_Constants = require('../user_test_constants');

const DESCRIPTION = 'should return valid user data when registering';

class Registration_Test extends CodeStream_API_Test {

	get_description () {
		return DESCRIPTION;
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/no-auth/register';
	}

	get_expected_fields () {
		return User_Test_Constants.EXPECTED_REGISTRATION_RESPONSE;
	}

	dont_want_token () {
		return true;
	}

	before (callback) {
		this.data = this.user_factory.get_random_user_data();
		callback();
	}

	validate_response (data) {
		var user = data.user;
		var errors = [];
		var result = (
			((
				user.emails instanceof Array &&
				user.emails.length === 1 &&
				user.emails[0] === this.data.emails[0]
			) || errors.push('incorrect emails')) &&
			((user.username === this.data.username) || errors.push('incorrect username')) &&
			((user.first_name === this.data.first_name) || errors.push('incorrect first name')) &&
			((user.last_name === this.data.last_name) || errors.push('incorrect last name')) &&
			((user.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof user.created_at === 'number') || errors.push('created_at not number')) &&
			((user.modified_at >= user.created_at) || errors.push('modified_at not greater than or equal to created_at')) &&
			((user.creator_id === user._id.toString()) || errors.push('creator_id not equal to _id')) &&
			((typeof user.confirmation_code === 'string') || errors.push('confirmation_code is not a string'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		delete user.confirmation_code; // this is technically unsanitized, but this request (and only this request) allows it
		this.validate_sanitized(user, User_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Registration_Test;
