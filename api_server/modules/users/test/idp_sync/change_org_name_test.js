'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class ChangeOrgNameTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should change current company\'s name when name change is discovered through IDP';
	}

	get method () {
		return 'get';
	}

	// set mock data to use during the test
	makeMockData (callback) {
		this.testOrg = true;
		this.path = '/companies/' + this.company.id;
		this.data = {
			name: this.companyFactory.randomName()
		};
		super.makeMockData(callback);
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.strictEqual(data.company.name, this.data.name, 'fetched company\'s name does not match');
	}
}

module.exports = ChangeOrgNameTest;
