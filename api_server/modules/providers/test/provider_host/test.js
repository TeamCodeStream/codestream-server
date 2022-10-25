// handle unit tests for the "PUT /provider-host" request, to add a provider host instance
// for a given team

'use strict';

const ProviderHostTest = require('./provider_host_test');
const TeamNotFoundTest = require('./team_not_found_test');
const ACLTest = require('./acl_test');
const HostRequiredTest = require('./host_required_test');
const UnknownProviderTest = require('./unknown_provider_test');
const FetchTest = require('./fetch_test');
const MessageToTeamTest = require('./message_to_team_test');

const TEST_HOSTS = [
	{
		provider: 'jiraserver',
		host: 'https://jira.codestream.us'
	},
	/*
	{
		provider: 'github_enterprise',
		host: 'https://git.codestream.us',
		hasCodeHosting: true
	},
	{
		provider: 'gitlab_enterprise',
		host: 'https://gitlab.codestream.us',
		hasCodeHosting: true
	},
	{
		provider: 'bitbucket_server',
		host: 'https://bitbucket.codestream.us',
		hasCodeHosting: true
	}
	*/
];

var TEST_HOST_NUM = 0;
var SameTestHostNum = () => {
	return TEST_HOST_NUM % TEST_HOSTS.length;
};
var NextTestHostNum = () => {
	return (TEST_HOST_NUM++) % TEST_HOSTS.length;
};

class ProviderHostRequestTester {

	test () {
		new ProviderHostTest({ 
			provider: TEST_HOSTS[SameTestHostNum()].provider,
			hasCodeHosting: TEST_HOSTS[SameTestHostNum()].hasCodeHosting,
			host: TEST_HOSTS[NextTestHostNum()].host
		}).test();
		new TeamNotFoundTest({
			provider: TEST_HOSTS[SameTestHostNum()].provider,
			hasCodeHosting: TEST_HOSTS[SameTestHostNum()].hasCodeHosting,
			host: TEST_HOSTS[NextTestHostNum()].host
		}).test();
		new ACLTest({
			provider: TEST_HOSTS[SameTestHostNum()].provider,
			hasCodeHosting: TEST_HOSTS[SameTestHostNum()].hasCodeHosting,
			host: TEST_HOSTS[NextTestHostNum()].host
		}).test();
		new HostRequiredTest({
			provider: TEST_HOSTS[SameTestHostNum()].provider,
			hasCodeHosting: TEST_HOSTS[SameTestHostNum()].hasCodeHosting,
			host: TEST_HOSTS[NextTestHostNum()].host
		}).test();
		new UnknownProviderTest({
			provider: TEST_HOSTS[SameTestHostNum()].provider,
			hasCodeHosting: TEST_HOSTS[SameTestHostNum()].hasCodeHosting,
			host: TEST_HOSTS[NextTestHostNum()].host
		}).test();
		new FetchTest({
			provider: TEST_HOSTS[SameTestHostNum()].provider,
			hasCodeHosting: TEST_HOSTS[SameTestHostNum()].hasCodeHosting,
			host: TEST_HOSTS[NextTestHostNum()].host
		}).test();
		new MessageToTeamTest({
			provider: TEST_HOSTS[SameTestHostNum()].provider,
			hasCodeHosting: TEST_HOSTS[SameTestHostNum()].hasCodeHosting,
			host: TEST_HOSTS[NextTestHostNum()].host
		}).test();
	}
}

module.exports = new ProviderHostRequestTester();
