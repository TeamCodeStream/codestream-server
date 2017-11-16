'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class AuthenticationTest extends CodeStreamAPITest {

	get description () {
		return 'should allow access to resources when a valid access token is supplied';
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/users/me';
	}
}

module.exports = AuthenticationTest;
