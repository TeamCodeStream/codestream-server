// handle unit tests for the "POST /no-auth/provider-token/:provider" request,
// to set a provider token for a provider after being collected from the client
 
'use strict';

const PostProviderTokenTest = require('./post_provider_token_test');
const UnknownProviderTest = require('./unknown_provider_test');
const InvalidProviderTest = require('./invalid_provider_test');
const TokenRequiredTest = require('./token_required_test');
const InvalidTokenTest = require('./invalid_token_test');
const BadProviderIdentityMatchTest = require('./bad_provider_identity_match_test');
const NoSignUpTest = require('./no_signup_test');
const ExistingUnregisteredUserTest = require('./existing_unregistered_user_test');
const ExistingRegisteredUserTest = require('./existing_registered_user_test');

const PROVIDERS = [
	'github'
];

class PostProviderTokenRequestTester {

	test () {
		PROVIDERS.forEach(provider => {
			new PostProviderTokenTest({ provider }).test();
			new InvalidTokenTest({ provider }).test();
			new BadProviderIdentityMatchTest({ provider }).test();
			new NoSignUpTest({ provider }).test();
			new ExistingUnregisteredUserTest({ provider }).test();
			new ExistingRegisteredUserTest({ provider }).test();
			});
		new UnknownProviderTest().test();
		new InvalidProviderTest().test();
		new TokenRequiredTest({ provider: 'github' }).test();
	}
}

module.exports = new PostProviderTokenRequestTester();
