// handle unit tests for the "PUT /provider-info/:provider" request,
// to set miscellaneous info for a user to access a third-party provider
 
'use strict';

const ProviderInfoTest = require('./provider_info_test');
const TeamNotFoundTest = require('./team_not_found_test');
const ACLTest = require('./acl_test');
const ParameterRequiredTest = require('./parameter_required_test');
const UnknownProviderTest = require('./unknown_provider_test');
const FetchTest = require('./fetch_test');
const MessageToUserTest = require('./message_to_user_test');

class ProviderInfoRequestTester {

	test () {
		new ProviderInfoTest({ provider: 'trello' }).test();
		new ProviderInfoTest({ provider: 'github', testHost: 'github.codestream.us' }).test();
		new TeamNotFoundTest({ provider: 'asana' }).test();
		new ACLTest({ provider: 'jira' }).test();
		new ParameterRequiredTest({ provider: 'gitlab', parameter: 'teamId' }).test();
		new ParameterRequiredTest({ provider: 'bitbucket', parameter: 'data' }).test();
		new UnknownProviderTest({ provider: 'unknown' }).test();
		new FetchTest({ provider: 'youtrack' }).test();
		new MessageToUserTest({ provider: 'slack' }).test();
	}
}

module.exports = new ProviderInfoRequestTester();
