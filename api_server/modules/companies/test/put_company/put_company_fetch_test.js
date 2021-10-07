'use strict';

const PutCompanyTest = require('./put_company_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const CompanyTestConstants = require('../company_test_constants');

class PutCompanyFetchTest extends PutCompanyTest {

	get description () {
		return 'should properly update a company when requested, checked by fetching the company';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { company: CompanyTestConstants.EXPECTED_COMPANY_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.updateCompany	// perform the actual update
		], callback);
	}

	// validate that the response is correct
	validateResponse (data) {
		Assert(data.company.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the company was updated');
		this.expectedCompany.modifiedAt = data.company.modifiedAt;
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.company, this.expectedCompany, 'fetched company does not match');
	}
}

module.exports = PutCompanyFetchTest;
