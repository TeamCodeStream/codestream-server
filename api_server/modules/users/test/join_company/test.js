// handle unit tests for the "PUT /companies/join/:id" request, to join a company

'use strict';

const JoinCompanyTest = require('./join_company_test');
const JoinCompanyLoginTest = require('./join_company_login_test');
const OneUserPerOrgEnabledTest = require('./one_user_per_org_enabled_test');
const CompanyNotFoundTest = require('./company_not_found_test');
const CompanyDeactivatedTest = require('./company_deactivated_test');
const ACLTest = require('./acl_test');
const ACLByDomainTest = require('./acl_by_domain_test');
const NoDomainJoiningTest = require('./no_domain_joining_test');
const MessageToTeamTest = require('./message_to_team_test');

class JoinCompanyRequestTester {

	test () {
 		new JoinCompanyTest().test();
		new JoinCompanyTest({ byDomainJoining: true }).test();
		new JoinCompanyLoginTest().test();
		new JoinCompanyLoginTest({ byDomainJoining: true }).test();
		new OneUserPerOrgEnabledTest().test();
		new CompanyNotFoundTest().test();
		new CompanyDeactivatedTest().test();
		new ACLTest().test();
		new ACLByDomainTest().test();
		new NoDomainJoiningTest().test();
		new MessageToTeamTest().test();
		new MessageToTeamTest({ byDomainJoining: true }).test();
	}
}

module.exports = new JoinCompanyRequestTester();
