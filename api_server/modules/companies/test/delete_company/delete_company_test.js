// base class for many tests of the "DELETE /companies/:id" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const CompanyTestConstants = require('../company_test_constants');

class DeleteCompanyTest extends Aggregation(CodeStreamAPITest, CommonInit) {
	get description () {
		return 'should return the deactivated company when deleting a company';
	}

	get method () {
		return 'delete';
	}

	before (callback) {
		this.init(callback);
	}

	validateResponse (data) {
		const company = data.company;
		// make sure the company name is set to deactivated form (with a '-deactivated<timestamp>' part)
		const name = this.company.name;
		const nameRegex = new RegExp(`${name}-deactivated([0-9]*)`);
		const nameMatch = company.$set.name.match(nameRegex);
		Assert(nameMatch, 'name not set to deactivated form');
		const deactivatedAt = parseInt(nameMatch[1]);
		Assert(deactivatedAt >= this.modifiedAfter, 'deactivated timestamp is not greater than before the company was deleted');
		// set name so deepEqual works
		this.expectedData.company.$set.name = `${name}-deactivated${deactivatedAt}`;

		// verify modifiedAt was updated, and then set it so the deepEqual works
		Assert(company.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the company was deleted');
		this.expectedData.company.$set.modifiedAt = company.$set.modifiedAt;

		// verify we got back the proper response
		Assert.deepEqual(data, this.expectedData, 'response data is not correct');

		// verify the company in the response has no attributes that should not go to clients
		this.validateSanitized(data.company.$set, CompanyTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = DeleteCompanyTest;