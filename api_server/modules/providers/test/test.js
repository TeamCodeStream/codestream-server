// handle unit tests for the providers module

'use strict';

// make eslint happy
/* globals describe */

const ProviderConnectRequestTester = require('./provider_connect/test');
const ProviderAuthCodeRequestTester = require('./provider_authcode/test');
const ProviderAuthRequestTester = require('./provider_auth/test');
const ProviderTokenRequestTester = require('./provider_token/test');
const ProviderDeauthRequestTester = require('./provider_deauth/test');
const ProviderRefreshRequestTester = require('./provider_refresh/test');
const ProviderSetTokenRequestTester = require('./provider_set_token/test');
const ProviderInfoRequestTester = require('./provider_info/test');
const ProviderHostRequestTester = require('./provider_host/test');
const DeleteProviderHostRequestTester = require('./delete_provider_host/test');
//const ProviderActionRequestTester = require('./provider_action/test');

describe('provider requests', function() {

	this.timeout(20000);

	describe('PUT /no-auth/provider-connect/:provider', ProviderConnectRequestTester.test);
	describe('GET /provider-auth-code', ProviderAuthCodeRequestTester.test);
	describe('GET /no-auth/provider-auth/:provider', ProviderAuthRequestTester.test);
	describe('GET /no-auth/provider-token/:provider', ProviderTokenRequestTester.test);
	describe('PUT /provider-deauth/:provider', ProviderDeauthRequestTester.test);
	describe('GET /provider-refresh/:provider', ProviderRefreshRequestTester.test);
	describe('PUT /provider-set-token/:provider', ProviderSetTokenRequestTester.test);
	describe('PUT /provider-info/:provider', ProviderInfoRequestTester.test);
	describe('PUT /provider-host/:provider/:teamId', ProviderHostRequestTester.test);
	describe('DELETE /provider-host/:provider/:teamId/:providerId', DeleteProviderHostRequestTester.test);
	// Disable these tests until providerIdentities comes back
	//describe('POST /no-auth/provider-action/:provider', ProviderActionRequestTester.test);
});
