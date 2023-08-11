// handle unit tests for the "PUT /no-auth/provider-token/:provider" request,
// to complete a third-party authorization flow
 
'use strict';

const ProviderTokenTest = require('./provider_token_test');
const UnknownProviderTest = require('./unknown_provider_test');
const StateRequiredTest = require('./state_required_test');
const InvalidTokenTest = require('./invalid_token_test');
const NoTokenTest = require('./no_token_test');
const TokenExpiredTest = require('./token_expired_test');
const WrongTokenTypeTest = require('./wrong_token_type_test');
const UserNotFoundTest = require('./user_not_found_test');
const UserNotOnTeamTest = require('./user_not_on_team_test');
const MessageTest = require('./message_test');
const IdentityMatchTest = require('./identity_match_test');
const InvalidIdentityTokenTest = require('./invalid_identity_token_test');
const BadProviderIdentityMatchTest = require('./bad_provider_identity_match_test');
const NoIdentityMatchTokenTest = require('./no_identity_match_token_test');
const NoSignUpTest = require('./no_signup_test');
const ExistingUserTest = require('./existing_user_test');
const AlreadyRegisteredTest = require('./already_registered_test');

const PROVIDERS = [
	'trello',
	'github',
	'asana',
	'jira',
	'gitlab',
	'bitbucket',
	'youtrack',
	'azuredevops',
	'slack',
];

const ENTERPRISE_PROVIDERS = {
	'github_enterprise': 'https://git.codestream.us',
	'jiraserver': 'https://jira.codestream.us',
	'gitlab_enterprise': 'https://gitlab.codestream.us',
	'bitbucket_server': 'https://bitbucket.codestream.us'
};

const AUTH_PROVIDERS = [
	'github',
	'gitlab',
	'bitbucket'
];

class ProviderTokenRequestTester {

	test () {
		PROVIDERS.forEach(provider => {
			new ProviderTokenTest({ provider }).test();
			new MessageTest({ provider }).test();
		});
		Object.keys(ENTERPRISE_PROVIDERS).forEach(provider => {
			const testHost = ENTERPRISE_PROVIDERS[provider];
			new ProviderTokenTest({ provider, testHost }).test();
			new MessageTest({ provider, testHost }).test();
		});
		AUTH_PROVIDERS.forEach(provider => {
			new IdentityMatchTest({ provider }).test();
			new InvalidIdentityTokenTest({ provider }).test();
			new BadProviderIdentityMatchTest({ provider }).test();
			new NoIdentityMatchTokenTest({ provider }).test();
			new NoSignUpTest({ provider }).test();
			new ExistingUserTest({ provider }).test();
			new ExistingUserTest({ provider, userIsInvited: true }).test();
			// COLIN FML
			// These are disabled per NR-123475, replaced by AlreadyRegisteredTest
			new ExistingUserTest({ provider, isRegistered: true }).test();
			new ExistingUserTest({ provider, userIsInvited: true, isRegistered: true }).test();
			//new AlreadyRegisteredTest({ provider }).test();
			//new AlreadyRegisteredTest({ provider, userIsInvited: true }).test();
		});
		new UnknownProviderTest().test();
		new StateRequiredTest({ provider: 'trello' }).test();
		new InvalidTokenTest({ provider: 'github' }).test();
		new NoTokenTest({ provider: 'asana' }).test();
		new TokenExpiredTest({ provider: 'jira' }).test();
		new WrongTokenTypeTest({ provider: 'gitlab' }).test();
		new UserNotFoundTest({ provider: 'bitbucket' }).test();
		new UserNotOnTeamTest({ provider: 'trello' }).test();
	}
}

module.exports = new ProviderTokenRequestTester();
