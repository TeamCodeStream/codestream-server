'use strict';

var Authentication_Test = require('./authentication_test');

class Authentication_Invalid_Token_Test extends Authentication_Test {

	get description () {
		return 'should prevent access to resources when access token is invalid';
	}

	get_expected_error () {
		return {
			code: 'AUTH-1002'
		};
	}

	before (callback) {
		this.token += 'x';
		super.before(callback);
	}
}

module.exports = Authentication_Invalid_Token_Test;
