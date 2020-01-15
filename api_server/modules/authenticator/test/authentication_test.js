'use strict';

const CodeStreamAPIBaseTest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_base_test');

/*
CodeStreamAPITest handles setting up a user with a valid access token, and by default
sends the access token with the request ... we'll just issue a request for the user's
own user object (/users/me) and confirm it works
*/

class AuthenticationTest extends CodeStreamAPIBaseTest {

	constructor (options) {
		super(options);
		this.currentUserIndex = 0;
	}

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
