'use strict';

var Assert = require('assert');
var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const User_Test_Constants = require('../user_test_constants');
const Secrets_Config = require(process.env.CS_API_TOP + '/config/secrets.js');

class Registration_Test extends CodeStream_API_Test {

	get description () {
		return 'should return valid user data when registering';
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
		this.data._confirmation_cheat = Secrets_Config.confirmation_cheat;
		callback();
	}

	validate_response (data) {
		let user = data.user;
		let errors = [];
		(user.secondary_emails || []).sort();
		(this.data.secondary_emails || []).sort();
		let result = (
			((user.email === this.data.email) || errors.push('incorrect email')) &&
			((JSON.stringify(user.secondary_emails) === JSON.stringify(this.data.secondary_emails)) || errors.push('secondary_emails does not natch')) &&
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
		delete user.confirmation_code; // this is technically unsanitized, but we "cheat" during the test
		this.validate_sanitized(user, User_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Registration_Test;
