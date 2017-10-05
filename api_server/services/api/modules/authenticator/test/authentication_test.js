'use strict';

var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');

const DESCRIPTION = 'should allow access to resources when a valid access token is supplied';

class Authentication_Test extends CodeStream_API_Test {

	get_description () {
		return DESCRIPTION;
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/users/~';
	}
}

module.exports = Authentication_Test;
