'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');

class AddNRInfoTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should set test New Relic account/org data for the company when requested';
	}

	get method () { 
		return 'post';
	}
	
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert(data.company.$set.modifiedAt >= this.updatedAt, 'modifiedAt not changed');
		this.expectedData.company.$set.modifiedAt = data.company.$set.modifiedAt;
		if (this.expectedData.company.$set.nrAccountIds) {
			this.expectedData.company.$set.nrAccountIds.sort();
			data.company.$set.nrAccountIds.sort();
		}
		if (this.expectedData.company.$set.nrOrgIds) {
			this.expectedData.company.$set.nrOrgIds.sort();
			data.company.$set.nrOrgIds.sort();
		}
		Assert.deepStrictEqual(data, this.expectedData, 'response is incorrect');
	}
}

module.exports = AddNRInfoTest;
