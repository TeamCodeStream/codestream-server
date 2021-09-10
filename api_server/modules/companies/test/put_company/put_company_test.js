// base class for many tests of the "PUT /companies" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const CompanyTestConstants = require('../company_test_constants');

class PutCompanyTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the updated company when updating a company';
	}

	get method () {
		return 'put';
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify modifiedAt was updated, and then set it so the deepEqual works
		Assert(data.company.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the before was updated');
		this.expectedData.company.$set.modifiedAt = data.company.$set.modifiedAt;
		// verify we got back the proper response
		Assert.deepEqual(data, this.expectedData, 'response data is not correct');
		// verify the company in the response has no attributes that should not go to clients
		this.validateSanitized(data.company.$set, CompanyTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = PutCompanyTest;
