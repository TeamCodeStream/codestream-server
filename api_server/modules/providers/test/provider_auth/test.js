// handle unit tests for the "PUT /no-auth/provider-auth/:provider" request,
// to initiate a third-party authorization flow
 
'use strict';

const ProviderAuthTest = require('./provider_auth_test');
const UnknownProviderTest = require('./unknown_provider_test');
const NoCodeTest = require('./no_code_test');
const InvalidHostTest = require('./invalid_host_test');

const PROVIDERS = [
	'trello',
	'github',
	'asana',
	'jira',
	'gitlab',
	'bitbucket',
	//'youtrack',
	'azuredevops',
	//'msteams'
	//'glip'
];

const ENTERPRISE_PROVIDERS = {
//	'github_enterprise': 'https://git.codestream.us',
//	'jiraserver': 'https://jira.codestream.us'
};

class ProviderAuthRequestTester {

	test () {
		PROVIDERS.forEach(provider => {
			new ProviderAuthTest({ provider }).test();
		});
		Object.keys(ENTERPRISE_PROVIDERS).forEach(provider => {
			new ProviderAuthTest({ provider, testHost: ENTERPRISE_PROVIDERS[provider] }).test();
			new InvalidHostTest({ provider, testHost: ENTERPRISE_PROVIDERS[provider], testRequestHost: 'nothing.nothing.com' }).test();
		});
		new UnknownProviderTest().test();
		new NoCodeTest({ provider: 'github' }).test();
	}
}

module.exports = new ProviderAuthRequestTester();
