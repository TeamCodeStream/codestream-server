'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class NoApiKeyTest extends CodeStreamAPITest {

	get description () {
		return 'should return an error when no api key is provided';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/no-auth/nr-register';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			message: 'Parameter required',
			info: 'apiKey'
		};
	}
}

module.exports = NoApiKeyTest;
