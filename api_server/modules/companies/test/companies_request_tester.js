// handles unit tests for the companies module

'use strict';

var Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
var GetCompanyRequestTester = require('./get_company/get_company_request_tester');
var GetCompaniesRequestTester = require('./get_companies/get_companies_request_tester');

class CompaniesRequestTester extends Aggregation(
	GetCompanyRequestTester,
	GetCompaniesRequestTester
) {
}

module.exports = CompaniesRequestTester;
