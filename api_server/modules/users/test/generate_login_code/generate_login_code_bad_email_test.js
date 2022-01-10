'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class GenerateLoginCodeBadEmailTest extends CodeStreamAPITest {

	get description () {
		return 'should return empty data when attempting to generate a login code for a nonexistent user';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/no-auth/generate-login-code';
	}

	before (callback) {
		super.before(error => {
			if (error) { callback(error); }
			this.data = {
				email: this.userFactory.randomEmail()
			};
			callback();
		});
	}

	validateResponse (data) {
		Assert.deepStrictEqual(data, {}, 'response contains unexpected data');
	}
}

module.exports = GenerateLoginCodeBadEmailTest;
