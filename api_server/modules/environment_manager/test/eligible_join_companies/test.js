// handle unit tests for the "GET /xenv/eligible-join-companies" request to fetch cross-environment companies
// that have domain joining on for a given domain
'use strict';

const EligibleJoinCompaniesTest = require('./eligible_join_companies_test');
const DomainOrEmailRequiredTest = require('./domain_or_email_required_test');
const NoSecretTest = require('./no_secret_test');
const IncorrectSecretTest = require('./incorrect_secret_test');

class EligibleJoinCompaniesRequestTester {

	test () {
		new EligibleJoinCompaniesTest().test();
		new EligibleJoinCompaniesTest({ oneUserPerOrg: true }).test();
		new DomainOrEmailRequiredTest().test();
		new DomainOrEmailRequiredTest({ oneUserPerOrg: true }).test();
		new NoSecretTest().test();
		new IncorrectSecretTest().test();
	}
}

module.exports = new EligibleJoinCompaniesRequestTester();
