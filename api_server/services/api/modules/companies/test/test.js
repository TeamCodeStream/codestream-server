'use strict';

// make jshint happy
/* globals describe */

var Companies_Request_Tester = require('./companies_request_tester');

var companies_request_tester = new Companies_Request_Tester();

describe('company requests', function() {

	this.timeout(10000);

	describe('GET /companies/:id', companies_request_tester.get_company_test);
	describe('GET /companies', companies_request_tester.get_companies_test);

});
