// provide basic test class for check-login request tests

'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CheckLoginTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'should return 200 response when doing a login check against proper credentials';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/no-auth/check-login';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data = {
				email: this.currentUser.user.email,
				password: this.currentUser.password
			};
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepStrictEqual(data, {}, 'empty response not returned');
	}
}

module.exports = CheckLoginTest;
