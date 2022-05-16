// unit tests associated with the authenticator module

'use strict';

// make eslint happy
/* globals describe */

const AuthenticationTest = require('./authentication_test');
const AuthenticationMissingAuthorizationTest = require('./authentication_missing_authorization_test');
const AuthenticationInvalidTokenTest = require('./authentication_invalid_token_test');
const AuthenticationNoUserIDTest = require('./authentication_no_user_id_test');
const AuthenticationUserNotFoundTest = require('./authentication_user_not_found_test');
const MinIssuanceTest = require('./min_issuance_test');
const ServiceGatewayCSUserIdTest = require('./service_gateway/service_gateway_cs_userid_test');
const ServiceGatewayCSUserIdFailsIfDisabledTest = require('./service_gateway/service_gateway_cs_userid_fails_if_disabled_test');
const ServiceGatewayCSUserIdUserNotFoundTest = require('./service_gateway/service_gateway_cs_userid_user_not_found_test');
const EnableServiceGatewayAuthTest = require('./service_gateway/enable_service_gateway_auth_test');
const EnableServiceGatewayBadAuthTest = require('./service_gateway/enable_service_gateway_bad_auth_test');
const ServiceGatewayNRUserIdTest = require('./service_gateway/service_gateway_nr_userid_test');
const ServiceGatewayNRUserIdFailsIfDisabledTest = require('./service_gateway/service_gateway_nr_userid_fails_if_disabled_test');
const ServiceGatewayNRUserIdUserNotFoundTest = require('./service_gateway/service_gateway_nr_userid_user_not_found_test');

const SerializeTests = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/serialize_tests');

describe('authentication', function() {

	this.timeout(5000);

	new AuthenticationTest().test();
	new AuthenticationMissingAuthorizationTest().test();
	new AuthenticationInvalidTokenTest().test();
	new AuthenticationNoUserIDTest().test();
	new AuthenticationUserNotFoundTest().test();
	new MinIssuanceTest().test();
	// since these tests enable and disable a global, they must be run sequentially so as not to interfere with each other
	SerializeTests([
		ServiceGatewayCSUserIdTest,
		ServiceGatewayCSUserIdFailsIfDisabledTest,
		ServiceGatewayCSUserIdUserNotFoundTest,
		EnableServiceGatewayAuthTest,
		EnableServiceGatewayBadAuthTest,
		ServiceGatewayNRUserIdTest,
		ServiceGatewayNRUserIdFailsIfDisabledTest,
		ServiceGatewayNRUserIdUserNotFoundTest
	])
});
