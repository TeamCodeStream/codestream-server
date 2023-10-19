// handle unit tests for the "PUT /web/provider-auth/:provider" request,
// to initiate a third-party authorization flow
 
'use strict';

const WebProviderAuthTest = require('./web_provider_auth_test');
const SignupTokenTest = require('./signup_token_test');
const AccessTest = require('./access_test');
const NoSignupTest = require('./no_signup_test');
const UnknownProviderTest = require('./unknown_provider_test');
const NewRelicIDPAuthTest = require('./newrelic_idp_auth_test');
const SignupTokenRequiredTest = require('./signup_token_required_test');
const AnonUserIDTest = require('./anon_user_id_test');
const NoSignupNewRelicTest = require('./no_signup_newrelic_test');

const PROVIDERS = [
	'github',
	'gitlab',
	'bitbucket'
];

const IDP_DOMAINS = [
	'github.com',
	'gitlab.com',
	'bitbucket.com',
	'google.com'
];

class WebProviderAuthRequestTester {

	test () {
		PROVIDERS.forEach(provider => {
			new WebProviderAuthTest({ provider }).test();
			new SignupTokenTest({ provider }).test();
			new AccessTest({ provider }).test();
			new NoSignupTest({ provider }).test();
		});
		new UnknownProviderTest().test();

		// these tests apply specifically to New Relic IDP sign-in, soon to be the one
		// and only way for users to sign in (in other words: IMPORTANT!)
		new NewRelicIDPAuthTest().test();
		new SignupTokenRequiredTest().test();
		new AnonUserIDTest().test();
		new NoSignupNewRelicTest().test();
		IDP_DOMAINS.forEach(idpDomain => {
			new NewRelicIDPAuthTest({ idpDomain }).test();
		});
	}
}

module.exports = new WebProviderAuthRequestTester();
