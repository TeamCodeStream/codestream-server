// handle unit tests for the "PUT /companies/:id" request, to update a company

'use strict';

const PutCompanyTest = require('./put_company_test');
const PutCompanyFetchTest = require('./put_company_fetch_test');
const CompanyNotFoundTest = require('./company_not_found_test');
//const NoEveryoneTeamTest = require('./no_everyone_team_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const MessageTest = require('./message_test');
const NoUpdateOtherAttributeTest = require('./no_update_other_attribute_test');

class PutCompanyRequestTester {

	test () {
		new PutCompanyTest().test();
		new PutCompanyFetchTest().test();
		new CompanyNotFoundTest().test();
		//new NoEveryoneTeamTest().test();
		new ACLTest().test();
		new ACLTeamTest().test();
		new MessageTest().test();
		new NoUpdateOtherAttributeTest({ attribute: 'teamIds' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'plan' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'trialStartDate' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'trialEndDate' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'planStartDate' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'stripeSessionId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'planPayor' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'planAmount' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'planFrequency' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'planPaidSeats' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'planCoupon' }).test();
	}
}

module.exports = new PutCompanyRequestTester();
