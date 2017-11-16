'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/lib/util/aggregation');
var GetCompanyRequestTester = require('./get_company/get_company_request_tester');
var GetCompaniesRequestTester = require('./get_companies/get_companies_request_tester');

class CompaniesRequestTester extends Aggregation(
	GetCompanyRequestTester,
	GetCompaniesRequestTester
) {
}

module.exports = CompaniesRequestTester;
