// handle unit tests for the "PUT /provider-deauth/:provider" request,
// to remove credentials for a particular user for a particular third-party provider
 
'use strict';

const ProviderDeauthTest = require('./provider_deauth_test');
const NoTeamIdTest = require('./no_team_id_test');
const MessageTest = require('./message_test');

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
	'msteams',
	'glip'
];

const ENTERPRISE_PROVIDERS = {
//	'github': 'git.codestream.us',
//	'youtrack': 'teamcodestream.youtrack.com'
};

const ENTERPRISE_ONLY_PROVIDERS = [
	'youtrack'
];

class ProviderDeauthRequestTester {

	test () {
		PROVIDERS.forEach(provider => {
			if (!ENTERPRISE_ONLY_PROVIDERS.includes(provider)) {
				new ProviderDeauthTest({ provider }).test();
				new MessageTest({ provider }).test();
			}
			if (Object.keys(ENTERPRISE_PROVIDERS).includes(provider)) {
				const testHost = ENTERPRISE_PROVIDERS[provider];
				new ProviderDeauthTest({ provider, testHost }).test();
				new MessageTest({ provider, testHost }).test();
			}
		});
		new NoTeamIdTest({ provider: 'trello' }).test();
	}
}

module.exports = new ProviderDeauthRequestTester();
