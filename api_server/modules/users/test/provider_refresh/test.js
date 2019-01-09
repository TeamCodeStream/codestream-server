// handle unit tests for the "PUT /provider-refresh" request,
// to handle obtaining an access token given a refresh token for a third-party provider
 
'use strict';

const ProviderRefreshTest = require('./provider_refresh_test');
const ParameterRequiredTest = require('./parameter_required_test');
const ACLTest = require('./acl_test');
const UnknownProviderTest = require('./unknown_provider_test');
const TeamNotFoundTest = require('./team_not_found_test');
const NoRefreshForProviderTest = require('./no_refresh_for_provider_test');
const InvalidTokenTest = require('./invalid_token_test');
const MessageTest = require('./message_test');

const PROVIDERS = [
	'asana',
	'jira',
	'bitbucket'
];

const UNSUPPORTED_PROVIDERS = [
	'trello',
	'github',
	'gitlab'
];

class ProviderRefreshTester {

	test () {
		PROVIDERS.forEach(provider => {
			new ProviderRefreshTest({ provider }).test();
			new InvalidTokenTest({ provider }).test();
			new MessageTest({ provider }).test();
		});
		UNSUPPORTED_PROVIDERS.forEach(provider => {
			new NoRefreshForProviderTest({ provider: 'asana', unsupportedProvider: provider }).test();
		});
		new ParameterRequiredTest({ provider: 'jira', parameter: 'teamId' }).test();
		new ParameterRequiredTest({ provider: 'bitbucket', parameter: 'refreshToken' }).test();
		new ACLTest({ provider: 'asana' }).test();
		new UnknownProviderTest({ provider: 'jira' }).test();
		new TeamNotFoundTest({ provider: 'bitbucket' }).test();
	}
}

module.exports = new ProviderRefreshTester();
