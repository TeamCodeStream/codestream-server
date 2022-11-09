// tests for "POST /no-auth/generate-login-code" and "PUT /no-auth/login-by-code"
'use strict';

const LoginByCodeTest = require('./login_by_code_test');
const InvalidCodeTest = require('./invalid_code_test');
const TooManyAttemptsTest = require('./too_many_attempts_test');
const ExpiredCodeTest = require('./expired_code_test');
const MissingParameterTest = require('./missing_parameter_test');
const CodeUsableOnceTest = require('./code_usable_once_test');
const InitialDataTest = require('./initial_data_test');
const EligibleJoinCompaniesTest = require('./eligible_join_companies_test');
const TeamIdTest = require('./team_id_test');
const FindTeamTest = require('./find_team_test');

class LoginByCodeTester {

	test () {
		new LoginByCodeTest().test();
		new LoginByCodeTest({ oneUserPerOrg: true }).test();
		new InvalidCodeTest().test();
		new TooManyAttemptsTest().test();
		new ExpiredCodeTest().test();
		new MissingParameterTest({ parameter: 'email' }).test();
		new MissingParameterTest({ parameter: 'loginCode' }).test();
		new CodeUsableOnceTest().test();
		new InitialDataTest().test();
		new InitialDataTest({ oneUserPerOrg: true }).test(); // ONE_USER_PER_ORG
		new EligibleJoinCompaniesTest().test();
		new EligibleJoinCompaniesTest({ oneUserPerOrg: true }).test(); // ONE_USER_PER_ORG
		new TeamIdTest().test();
		new FindTeamTest().test();
	}
}

module.exports = new LoginByCodeTester();
