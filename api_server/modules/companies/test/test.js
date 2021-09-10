// handle unit tests for the companies module

'use strict';

// make eslint happy
/* globals describe */

const CompaniesRequestTester = require('./companies_request_tester');
const PostCompanyRequestTester = require('./post_company/test');
const CompanyTestGroupRequestTester = require('./company_test_group/test');
const PutCompanyRequestTester = require('./put_company/test');

const companiesRequestTester = new CompaniesRequestTester();

describe('company requests', function() {

	this.timeout(20000);

	describe('GET /companies/:id', companiesRequestTester.getCompanyTest);
	describe('GET /companies', companiesRequestTester.getCompaniesTest);
	describe('POST /companies', PostCompanyRequestTester.test);
	describe('PUT /company-test-group/:id', CompanyTestGroupRequestTester.test);
	describe('PUT /company/:id', PutCompanyRequestTester.test);
});
