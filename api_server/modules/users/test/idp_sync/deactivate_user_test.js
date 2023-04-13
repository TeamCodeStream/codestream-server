'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class DeactivateUserTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should deactivate current user when deleted user is discovered through IDP (based on user fetch throwing an error)';
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/users/me';
	}
	
	getExpectedError () {
		return {
			code: 'AUTH-1004'
		};
	}

	// set mock data to use during the test
	makeMockData (callback) {
		super.makeMockData(error => {
			if (error) { return callback(error); }
			this.mockHeaders['X-CS-NR-Mock-Deleted-User'] = true; 
			callback();
		});
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// override doLogin to expect a 403
	doLogin (callback) {
		super.doLogin(error => {
			Assert(error, 'no error thrown during login');
			callback();
		});
	}
}

module.exports = DeactivateUserTest;
