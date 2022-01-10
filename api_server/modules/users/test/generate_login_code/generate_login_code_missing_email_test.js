'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class GenerateLoginCodeMissingEmailTest extends CodeStreamAPITest {

	get description () {
		return 'should return an error when not specifying email';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/no-auth/generate-login-code';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'email'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { callback(error); }
			this.data = {};
			callback();
		});
	}

	validateResponse (data) {
		Assert.deepStrictEqual(data, {}, 'response contains unexpected data');
	}
}

module.exports = GenerateLoginCodeMissingEmailTest;
