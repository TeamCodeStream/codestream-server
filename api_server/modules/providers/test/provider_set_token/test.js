// handle unit tests for the "PUT /provider-set-token/:provider" request,
// to set a token for a user to access a third-party provider
 
'use strict';

const ProviderSetTokenTest = require('./provider_set_token_test');
const TeamNotFoundTest = require('./team_not_found_test');
const ACLTest = require('./acl_test');
const ParameterRequiredTest = require('./parameter_required_test');
const UnknownProviderTest = require('./unknown_provider_test');
const FetchTest = require('./fetch_test');
const MessageToUserTest = require('./message_to_user_test');

class ProviderSetTokenRequestTester {

	test () {
		new ProviderSetTokenTest({ provider: 'trello' }).test();
		new ProviderSetTokenTest({ provider: 'github', testHost: 'github.codestream.us' }).test();
		new TeamNotFoundTest({ provider: 'asana' }).test();
		new ACLTest({ provider: 'jira' }).test();
		new ParameterRequiredTest({ provider: 'gitlab', parameter: 'teamId' }).test();
		new ParameterRequiredTest({ provider: 'bitbucket', parameter: 'token' }).test();
		new UnknownProviderTest({ provider: 'unknown' }).test();
		new FetchTest({ provider: 'youtrack' }).test();
		new MessageToUserTest({ provider: 'slack' }).test();
	}
}

module.exports = new ProviderSetTokenRequestTester();
