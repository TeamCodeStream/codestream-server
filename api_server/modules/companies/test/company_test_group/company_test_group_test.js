'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');

class CompanyTestGroupTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should set test group data for the company when requested';
	}

	get method () { 
		return 'put';
	}
	
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert(data.company.$set.modifiedAt >= this.updatedAt, 'modifiedAt not changed');
		this.expectedData.company.$set.modifiedAt = data.company.$set.modifiedAt;
		Assert.deepStrictEqual(data, this.expectedData, 'response is incorrect');
	}
}

module.exports = CompanyTestGroupTest;
