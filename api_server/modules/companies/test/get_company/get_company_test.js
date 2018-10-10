'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CompanyTestConstants = require('../company_test_constants');

class GetCompanyTest extends CodeStreamAPITest {

	get description () {
		return 'should return a valid company when requesting a company created by me';
	}

	// what we expect in the response
	getExpectedFields () {
		return { company: CompanyTestConstants.EXPECTED_COMPANY_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setPath
		], callback);
	}

	// set the path for the request to test
	setPath (callback) {
		// requesting the company created by the other user, but i was included in the team
		this.path = '/companies/' + this.company._id;
		callback();
	}

	// validate that we got the right company
	validateResponse (data) {
		this.validateMatchingObject(this.company._id, data.company, 'company');
		this.validateSanitized(data.company, CompanyTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetCompanyTest;
