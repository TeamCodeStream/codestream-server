// provide a base class for many of the tests of the "POST /companies" request to create a company
'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CompanyTestConstants = require('../company_test_constants');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class PostCompanyTest extends CodeStreamAPITest {

	get method () {
		return 'post';
	}

	get path () {
		return '/companies';
	}

	get description () {
		return 'should return a valid company when creating a new company';
	}

	getExpectedFields () {
		return CompanyTestConstants.EXPECTED_COMPANY_RESPONSE;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.makeCompanyData
		], callback);
	}

	// make the data to use when issuing the request
	makeCompanyData (callback) {
		this.data = {
			name: this.companyFactory.randomName()
		};
		callback();
	}

	/* eslint complexity: 0 */
	// validate the response to the test request
	validateResponse (data) {
		const company = data.company;
		const errors = [];
		const result = (
			((company.id === company._id) || errors.push('id not set to _id')) && 	// DEPRECATE ME
			((company.name === this.data.name) || errors.push('name does not match')) &&
			((company.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof company.createdAt === 'number') || errors.push('createdAt not number')) &&
			((company.modifiedAt >= company.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((company.creatorId === this.currentUser.user.id) || errors.push('creatorId not equal to current user id')) &&
			((company.teamIds.length === 0) || errors.push('teamIds should be zero length array'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		this.validateSanitized(company, CompanyTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = PostCompanyTest;
