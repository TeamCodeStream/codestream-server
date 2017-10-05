'use strict';

var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');
var User_Test_Constants = require('../user_test_constants');

const DESCRIPTION = 'should return myself when requesting myself';

class Get_Myself_Test extends CodeStream_API_Test {

	get_description () {
		return DESCRIPTION + (this.id ? ' by id' : '');
	}

	get_expected_fields () {
		return User_Test_Constants.EXPECTED_USER_RESPONSE;
	}

	before (callback) {
		this.path = '/users/' + (this.id || this.current_user._id);
		callback();
	}

	validate_response (data) {
		this.validate_matching_object(this.current_user._id, data.user, 'user');
		this.validate_sanitized(data.user, User_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Get_Myself_Test;
