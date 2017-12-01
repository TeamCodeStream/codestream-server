'use strict';

// make jshint happy
/* globals describe */

var CompaniesRequestTester = require('./companies_request_tester');

var companiesRequestTester = new CompaniesRequestTester();

describe('company requests', function() {

	this.timeout(20000);

	describe('GET /companies/:id', companiesRequestTester.getCompanyTest);
	describe('GET /companies', companiesRequestTester.getCompaniesTest);

});
