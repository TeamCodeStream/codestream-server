// handle unit tests for the "DELETE /provider-host" request, to delete a provider host instance
// for a given team

'use strict';

const DeleteProviderHostTest = require('./delete_provider_host_test');
const TeamNotFoundTest = require('./team_not_found_test');
const ACLTest = require('./acl_test');
const UnknownProviderTest = require('./unknown_provider_test');
const FetchTest = require('./fetch_test');
const MessageToTeamTest = require('./message_to_team_test');

const TEST_HOSTS = [
	{
		provider: 'github_enterprise',
		host: 'https://git.codestream.us'
	},
	{
		provider: 'jiraserver',
		host: 'https://jira.codestream.us'
	},
	{
		provider: 'gitlab_enterprise',
		host: 'https://gitlab.codestream.us'
	},
	{
		provider: 'bitbucket_server',
		host: 'https://bitbucket.codestream.us'
	}
];

var TEST_HOST_NUM = 0;
var SameTestHostNum = () => {
	return TEST_HOST_NUM % TEST_HOSTS.length;
};
var NextTestHostNum = () => {
	return (TEST_HOST_NUM++) % TEST_HOSTS.length;
};

class DeleteProviderHostRequestTester {

	test () {
		new DeleteProviderHostTest({ 
			provider: TEST_HOSTS[SameTestHostNum()].provider,
			host: TEST_HOSTS[NextTestHostNum()].host
		}).test();
		new TeamNotFoundTest({
			provider: TEST_HOSTS[SameTestHostNum()].provider,
			host: TEST_HOSTS[NextTestHostNum()].host
		}).test();
		new ACLTest({
			provider: TEST_HOSTS[SameTestHostNum()].provider,
			host: TEST_HOSTS[NextTestHostNum()].host
		}).test();
		new UnknownProviderTest({
			provider: TEST_HOSTS[SameTestHostNum()].provider,
			host: TEST_HOSTS[NextTestHostNum()].host
		}).test();
		new FetchTest({
			provider: TEST_HOSTS[SameTestHostNum()].provider,
			host: TEST_HOSTS[NextTestHostNum()].host
		}).test();
		new MessageToTeamTest({
			provider: TEST_HOSTS[SameTestHostNum()].provider,
			host: TEST_HOSTS[NextTestHostNum()].host
		}).test();
	}
}

module.exports = new DeleteProviderHostRequestTester();
