// handle unit tests for the companies module

'use strict';

// make eslint happy
/* globals describe */

const CompaniesRequestTester = require('./companies_request_tester');
const PostCompanyRequestTester = require('./post_company/test');
const CompanyTestGroupRequestTester = require('./company_test_group/test');
const PutCompanyRequestTester = require('./put_company/test');
const JoinCompanyRequestTester = require('./join_company/test');
const AddNRInfoRequestTester = require('./add_nr_info/test');

const companiesRequestTester = new CompaniesRequestTester();

describe('company requests', function() {

	this.timeout(20000);

	describe('GET /companies/:id', companiesRequestTester.getCompanyTest);
	describe('GET /companies', companiesRequestTester.getCompaniesTest);
	describe('POST /companies', PostCompanyRequestTester.test);
	describe('PUT /company-test-group/:id', CompanyTestGroupRequestTester.test);
	describe('PUT /companies/:id', PutCompanyRequestTester.test);
	describe('PUT /companies/join/:id', JoinCompanyRequestTester.test);
	describe('POST /companies/add-nr-info/:id', AddNRInfoRequestTester.test);
});
