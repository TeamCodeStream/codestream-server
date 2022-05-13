'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

/*
CodeStreamAPITest handles setting up a user with a valid access token, and by default
sends the access token with the request ... we'll just issue a request for the user's
own user object (/users/me) and confirm it works
*/

class AuthenticationTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		delete this.teamOptions.creatorIndex;
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
