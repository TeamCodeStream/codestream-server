'use strict';

var Aggregation = require(process.env.CI_API_TOP + '/lib/util/aggregation');
var Get_Company_Request_Tester = require('./get_company/get_company_request_tester');
var Get_Companies_Request_Tester = require('./get_companies/get_companies_request_tester');

class Companies_Request_Tester extends Aggregation(
	Get_Company_Request_Tester,
	Get_Companies_Request_Tester
) {
}

module.exports = Companies_Request_Tester;
