// handle unit tests for the "POST /companies" request, to create a company

'use strict';

const PostCompanyTest = require('./post_company_test');
const NoAttributeTest = require('./no_attribute_test');
const MessageToUserTest = require('./message_to_user_test');
const JoiningTest = require('./joining_test');
const NoWebmailForDomainJoiningTest = require('./no_webmail_for_domain_joining_test');
const SubscriptionTest = require('./subscription_test');
const LoginTest = require('./login_test');
const FirstCompanyOneUserPerOrgTest = require('./first_company_one_user_per_org_test');
const ClearFirstSessionTest = require('./clear_first_session_test');
const NRUserIdTest = require('./nr_user_id_test');
const LinkedNROrgIdTest = require('./linked_nr_org_id_test');
const CompanyNameFromRegistrationTest = require('./company_name_from_registration_test');
const RefreshTokenTest = require('./refresh_token_test');
const RefreshTokenBehindSGTest = require('./refresh_token_behind_sg_test');
const FirstCompanyRefreshTokenTest = require('./first_company_refresh_token_test');
const FirstCompanyRefreshTokenBehindSGTest = require('./first_company_refresh_token_behind_sg_test');
const RefreshTokenFetchTest = require('./refresh_token_fetch_test');
const FirstCompanyRefreshTokenFetchTest = require('./first_company_refresh_token_fetch_test');
const RefreshTokenBehindSGFetchTest = require('./refresh_token_behind_sg_fetch_test');

const SerializeTests = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/serialize_tests');

class PostCompanyRequestTester {

	test () {
		/*
		new PostCompanyTest().test();
		new PostCompanyTest({ unifiedIdentityEnabled: true }).test();
		new NoAttributeTest({ attribute: 'name' }).test();
		new MessageToUserTest().test();
		new JoiningTest().test();
		new NoWebmailForDomainJoiningTest().test();
		new SubscriptionTest().test();
		new LoginTest().test();
		new FirstCompanyOneUserPerOrgTest().test();
		new FirstCompanyOneUserPerOrgTest({ unifiedIdentityEnabled: true }).test();
		new ClearFirstSessionTest().test();
		new NRUserIdTest().test();
		new LinkedNROrgIdTest().test();
		new CompanyNameFromRegistrationTest().test();
		// TODO: wrong type validations
		// serialize these tests because they are time-dependent, and fail on the
		// default setup-then-run methodology
		*/
		SerializeTests([
			/*
			RefreshTokenTest,
			RefreshTokenBehindSGTest,
			FirstCompanyRefreshTokenTest,
			FirstCompanyRefreshTokenBehindSGTest,
			RefreshTokenFetchTest,
			FirstCompanyRefreshTokenFetchTest,
			*/
			RefreshTokenBehindSGFetchTest
			/*
			*/
		]);
	}
}

module.exports = new PostCompanyRequestTester();
