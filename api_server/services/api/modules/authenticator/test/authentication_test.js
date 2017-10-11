'use strict';

var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');

class Authentication_Test extends CodeStream_API_Test {

	get description () {
		return 'should allow access to resources when a valid access token is supplied';
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/users/~';
	}
}

module.exports = Authentication_Test;
