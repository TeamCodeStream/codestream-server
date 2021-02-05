// test constants for testing the providers module

'use strict';

const STANDARD_PROVIDER_HOSTS = { 
	'app*asana*com': {
		id: 'app*asana*com',
		name: 'asana',
		isEnterprise: false,
		host: 'app.asana.com',
		apiHost: 'app.asana.com',
		hasIssues: true 
	},
	'bitbucket*org': {
		id: 'bitbucket*org',
		name: 'bitbucket',
		isEnterprise: false,
		host: 'bitbucket.org',
		apiHost: 'api.bitbucket.org/2.0',
		hasIssues: true,
		hasCodeHosting: true,
		scopes: ['account', 'team', 'repository', 'issue:write', 'pullrequest:write']
	},
	'bitbucket/server': {
		id: 'bitbucket/server',
		name: 'bitbucket_server',
		isEnterprise: false,
		forEnterprise: true,
		hasCodeHosting: true,
		host: 'bitbucket/server',
		apiHost: 'api.bitbucket.org/2.0',
		scopes: ['projects:read', 'repositories:write']
	},
	'api*clubhouse*io/api/v3': {
		id: 'api*clubhouse*io/api/v3',
		name: 'clubhouse',
		isEnterprise: false,
		host: 'api.clubhouse.io/api/v3',
		apiHost: 'api.clubhouse.io/api/v3',
		needsConfigure: true,
		hasIssues: true
	},
	'linear*app': {
		apiHost: 'api.linear.app',
		hasIssues: true,
		host: 'linear.app',
		id: 'linear*app',
		isEnterprise: false,
		name: 'linear',
		scopes: ['read', 'issues:create']
	},
	'github*com': {
		id: 'github*com',
		name: 'github',
		isEnterprise: false,
		host: 'github.com',
		apiHost: 'api.github.com',
		hasIssues: true,
		hasCodeHosting: true,
		scopes: ['repo', 'read:user', 'user:email', 'notifications']
	},
	'github/enterprise': {
		id: 'github/enterprise',
		name: 'github_enterprise',
		isEnterprise: false,
		forEnterprise: true,
		host: 'github/enterprise',
		hasIssues: true,
		hasCodeHosting: true,
		scopes: ['repo', 'read:user', 'user:email', 'notifications']
	},
	'gitlab*com': {
		id: 'gitlab*com',
		name: 'gitlab',
		isEnterprise: false,
		host: 'gitlab.com',
		apiHost: 'gitlab.com/api/v4',
		hasIssues: true,
		hasCodeHosting: true
	},
	'gitlab/enterprise': {
		id: 'gitlab/enterprise',
		name: 'gitlab_enterprise',
		isEnterprise: false,
		forEnterprise: true,
		host: 'gitlab/enterprise',
		apiHost: 'gitlab.com/api/v4',
		hasIssues: true,
		hasCodeHosting: true,
		scopes: ['api']
	},
	'auth*atlassian*com': {
		id: 'auth*atlassian*com',
		name: 'jira',
		isEnterprise: false,
		host: 'auth.atlassian.com',
		apiHost: 'api.atlassian.com',
		hasIssues: true,
		scopes: ['read:jira-user', 'read:jira-work', 'write:jira-work', 'offline_access'],
		needsConfigureForOnPrem: true
	},
	'jiraserver/enterprise': {
		id: 'jiraserver/enterprise',
		name: 'jiraserver',
		isEnterprise: false,
		forEnterprise: true,
		needsConfigure: true,
		host: 'jiraserver/enterprise',
		hasIssues: true
	},
	'trello*com': {
		id: 'trello*com',
		name: 'trello',
		isEnterprise: false,
		host: 'trello.com',
		apiHost: 'api.trello.com/1',
		hasIssues: true,
		scopes: ['read', 'write']
	},
	'youtrack*com': {
		id: 'youtrack*com',
		name: 'youtrack',
		isEnterprise: false,
		needsConfigure: true,
		host: 'youtrack.com',
		hasIssues: true,
		scopes: ['YouTrack']
	},
	'app*vssps*visualstudio*com': {
		id: 'app*vssps*visualstudio*com',
		name: 'azuredevops',
		isEnterprise: false,
		needsConfigure: true,
		host: 'app.vssps.visualstudio.com',
		apiHost: 'dev.azure.com',
		hasIssues: true,
		scopes: ['vso.identity', 'vso.work_write']
	},
	'slack*com': {
		id: 'slack*com',
		name: 'slack',
		isEnterprise: false,
		host: 'slack.com',
		apiHost: 'slack.com/api',
		hasSharing: true,
		scopes: [
			'channels:read',
			'chat:write',
			'groups:read',
			'im:read',
			'users.profile:write',
			'users:read',
			'users:read.email',
			'mpim:read'
		]
	},
	'login*microsoftonline*com': {
		id: 'login*microsoftonline*com',
		name: 'msteams',
		isEnterprise: false,
		host: 'login.microsoftonline.com',
		apiHost: 'graph.microsoft.com/v1.0',
		hasSharing: true,
		scopes: [
			'User.Read.All',
			'Group.ReadWrite.All',
			'offline_access'
		]
	},
	'okta*com': {
		id: 'okta*com',
		name: 'okta',
		isEnterprise: false,
		host: 'okta.com',
		apiHost: 'okta.com',
		scopes: ['openid', 'email', 'profile']
	}
};

const GetStandardProviderHosts = function(config) {
	const ProviderHosts = JSON.parse(JSON.stringify(STANDARD_PROVIDER_HOSTS));
	if (
		!config.integrations.okta ||
		!config.integrations.okta.appClientId
	) {
		delete ProviderHosts['okta*com'];
	}
	return ProviderHosts;
};

module.exports = GetStandardProviderHosts;
