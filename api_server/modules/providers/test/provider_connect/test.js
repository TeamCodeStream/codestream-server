// handle unit tests for the "PUT /no-auth/provider-connect" request,
// to handle sign-in/sign-up via third-party providers (eg. slack)
 
'use strict';

const ProviderConnectTest = require('./provider_connect_test');
const NoAttributeTest = require('./no_attribute_test');
const NoCodeTest = require('./no_code_test');
const InvalidCodeTest = require('./invalid_code_test');
const UnknownProviderTest = require('./unknown_provider_test');
const NewUserJoiningConnectedTeamTest = require('./new_user_joining_connected_team_test');
const UserAlreadyConnectedOnTeamTest = require('./user_already_connected_on_team_test');
const TokenReplacementTest = require('./token_replacement_test');
const DuplicateProviderAuthTest = require('./duplicate_provider_auth_test');
const ExistingUnregisteredUserTest = require('./existing_unregistered_user_test');
const ExistingRegisteredUserTest = require('./existing_registered_user_test');
const ExistingUnregisterdUserOnTeamTest = require('./existing_unregistered_user_on_team_test');
const ExistingRegisterdUserOnTeamTest = require('./existing_registered_user_on_team_test');
const SignupTokenTest = require('./signup_token_test');
const InviteTest = require('./invite_test');
const TeamMismatchTest = require('./team_mismatch_test');
const TeamNoMatchTest = require('./team_no_match_test');

const PROVIDERS = [
	'slack'
];

class ProviderConnectRequestTester {

	test () {
		PROVIDERS.forEach(provider => {
			new ProviderConnectTest({ provider }).test();
			new NoAttributeTest({ provider, attribute: 'providerInfo' }).test();
			new NoCodeTest({ provider }).test();
			new InvalidCodeTest({ provider }).test();
			new NewUserJoiningConnectedTeamTest({ provider }).test();
			new UserAlreadyConnectedOnTeamTest({ provider }).test();
			new TokenReplacementTest({ provider }).test();
			new DuplicateProviderAuthTest({ provider }).test();
			new ExistingUnregisteredUserTest({ provider }).test();
			new ExistingRegisteredUserTest({ provider }).test();
			new ExistingUnregisterdUserOnTeamTest({ provider }).test();
			new ExistingRegisterdUserOnTeamTest({ provider }).test();
			new SignupTokenTest({ provider }).test();
			new InviteTest({ provider }).test();
			new TeamMismatchTest({ provider }).test();
			new TeamNoMatchTest({ provider }).test();
		});
		new UnknownProviderTest({ provider: 'blahblah' }).test();
	}
}

module.exports = new ProviderConnectRequestTester();
