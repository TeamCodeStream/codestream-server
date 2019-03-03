// handle unit tests for the "PUT /no-auth/provider-token/:provider" request,
// to complete a third-party authorization flow
 
'use strict';

const ProviderTokenTest = require('./provider_token_test');
const UnknownProviderTest = require('./unknown_provider_test');
const StateRequiredTest = require('./state_required_test');
const InvalidTokenTest = require('./invalid_token_test');
const TokenExpiredTest = require('./token_expired_test');
const WrongTokenTypeTest = require('./wrong_token_type_test');
const UserNotFoundTest = require('./user_not_found_test');
const UserNotOnTeamTest = require('./user_not_on_team_test');
const MessageTest = require('./message_test');

const PROVIDERS = [
	'trello',
	'github',
	'asana',
	'jira',
	'gitlab',
	'bitbucket',
	'slack',
	'msteams'
	//'glip'
];

const ENTERPRISE_PROVIDERS = {
	'github': 'git.codestream.us'
};

class ProviderTokenRequestTester {

	test () {
		PROVIDERS.forEach(provider => {
			new ProviderTokenTest({ provider }).test();
			new MessageTest({ provider }).test();
			if (Object.keys(ENTERPRISE_PROVIDERS).includes(provider)) {
				const testOrigin = ENTERPRISE_PROVIDERS[provider];
				new ProviderTokenTest({ provider, testOrigin }).test();
				new MessageTest({ provider, testOrigin }).test();
			}
		});
		new UnknownProviderTest().test();
		new StateRequiredTest({ provider: 'trello' }).test();
		new InvalidTokenTest({ provider: 'github' }).test();
		new TokenExpiredTest({ provider: 'asana' }).test();
		new WrongTokenTypeTest({ provider: 'jira' }).test();
		new UserNotFoundTest({ provider: 'gitlab' }).test();
		new UserNotOnTeamTest({ provider: 'bitbucket' }).test();
	}
}

module.exports = new ProviderTokenRequestTester();
