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
		hasIssues: true
	},
	'github*com': {
		id: 'github*com',
		name: 'github',
		isEnterprise: false,
		host: 'github.com',
		apiHost: 'api.github.com',
		hasIssues: true
	},
	'github/enterprise': {
		id: 'github/enterprise',
		name: 'github_enterprise',
		isEnterprise: false,
		forEnterprise: true,
		host: 'github/enterprise',
		hasIssues: true,
		scopes: ['repo', 'read:user', 'user:email']
	},
	'gitlab*com': {
		id: 'gitlab*com',
		name: 'gitlab',
		isEnterprise: false,
		host: 'gitlab.com',
		apiHost: 'gitlab.com/api/v4',
		hasIssues: true 
	},
	'gitlab/enterprise': {
		id: 'gitlab/enterprise',
		name: 'gitlab_enterprise',
		isEnterprise: false,
		forEnterprise: true,
		host: 'gitlab/enterprise',
		apiHost: 'gitlab.com/api/v4',
		hasIssues: true,
		scopes: ['api']
	},
	'auth*atlassian*com': {
		id: 'auth*atlassian*com',
		name: 'jira',
		isEnterprise: false,
		host: 'auth.atlassian.com',
		apiHost: 'api.atlassian.com',
		hasIssues: true
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
		hasIssues: true
	},
	'youtrack*com': {
		id: 'youtrack*com',
		name: 'youtrack',
		isEnterprise: false,
		needsConfigure: true,
		host: 'youtrack.com',
		hasIssues: true
	},
	'app*vssps*visualstudio*com': {
		id: 'app*vssps*visualstudio*com',
		name: 'azuredevops',
		isEnterprise: false,
		needsConfigure: true,
		host: 'app.vssps.visualstudio.com',
		apiHost: 'dev.azure.com',
		hasIssues: true
	},
	'slack*com': {
		id: 'slack*com',
		name: 'slack',
		isEnterprise: false,
		host: 'slack.com',
		apiHost: 'slack.com/api',
		hasSharing: true
	},
	'login*microsoftonline*com': {
		id: 'login*microsoftonline*com',
		name: 'msteams',
		isEnterprise: false,
		host: 'login.microsoftonline.com',
		apiHost: 'graph.microsoft.com/v1.0',
		hasSharing: true
	}
	/*
	'okta*com': {
		id: 'okta*com',
		name: 'okta',
		isEnterprise: false,
		host: 'okta.com',
		apiHost: 'okta.com'
	}
	*/
};

module.exports = {
	STANDARD_PROVIDER_HOSTS
};
