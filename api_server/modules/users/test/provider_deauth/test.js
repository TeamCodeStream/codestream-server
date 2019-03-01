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
	'slack',
	'msteams',
	'glip'
];

const ENTERPRISE_PROVIDERS = [
	'github'
];

class ProviderDeauthRequestTester {

	test () {
		PROVIDERS.forEach(provider => {
			new ProviderDeauthTest({ provider }).test();
			new MessageTest({ provider }).test();
			if (ENTERPRISE_PROVIDERS.includes(provider)) {
				new ProviderDeauthTest({ provider, testOrigin: true }).test();
				new MessageTest({ provider, testOrigin: true }).test();
			}
		});
		new NoTeamIdTest({ provider: 'trello' }).test();
	}
}

module.exports = new ProviderDeauthRequestTester();
