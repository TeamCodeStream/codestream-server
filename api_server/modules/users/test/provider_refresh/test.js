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
	'bitbucket',
	'gitlab',
	'msteams',
	'glip'
];

const UNSUPPORTED_PROVIDERS = [
	'trello',
	'github',
	'slack'
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
		new ACLTest({ provider: 'gitlab' }).test();
		new UnknownProviderTest({ provider: 'asana' }).test();
		new TeamNotFoundTest({ provider: 'jira' }).test();
	}
}

module.exports = new ProviderRefreshTester();
