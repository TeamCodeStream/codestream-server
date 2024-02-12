'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class DeactivateOrgTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should deactivate current company when deleted company is discovered through IDP (based on having no users in its auth domain)';
	}

	get method () {
		return 'get';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1004'
		};
	}

	// set mock data to use during the test
	makeMockData (callback) {
		this.testOrg = true;
		super.makeMockData(error => {
			if (error) { return callback(error); }
			this.path = '/companies/' + this.company.id;
			this.mockHeaders['X-CS-NR-Mock-Users'] = JSON.stringify([]); 
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
			delete this.data;
			callback();
		});
	}
}

module.exports = DeactivateOrgTest;
