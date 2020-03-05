// general api server configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');

let ApiCfg = CfgData.getSection('apiServer');
ApiCfg.runtimeEnvironment = CfgData.getProperty('sharedGeneral.runTimeEnvironment');

if (!ApiCfg.authOrigin) {
	ApiCfg.authOrigin = `${ApiCfg.publicApiUrl}/no-auth`;
}

// list of third-party providers available for integrations
// this is a superset of what may actually be available in a given installation, given which
// providers represent services that are enabled by configuration of the individual modules
ApiCfg.thirdPartyProviders = [
	'asana',
	'azuredevops',
	'bitbucket',
	'github',
	'github_enterprise',
	'gitlab',
	'gitlab_enterprise',
	'jira',
	'jiraserver',
	'msteams',
	'slack',
	'trello',
	'youtrack',
	'okta'
];

// matching these paths means Authorization header is not required
ApiCfg.unauthenticatedPaths = ['^\\/no-auth\\/', '^\\/robots\\.txt$'];

// matching these paths means Authorization header is optional, behavior may vary
ApiCfg.optionalAuthenticatedPaths = ['^\\/help(\\/|$)', '^\\/c\\/', '^\\/p\\/', '^\\/r\\/', '^\\/web\\/'];

// matching these paths means cookie authentication is required
ApiCfg.cookieAuthenticatedPaths = ['^\\/c\\/', '^\\/r\\/', '^\\/web\\/'];
ApiCfg.requiresCsrfProtectionPaths = [...ApiCfg.cookieAuthenticatedPaths, '^\\/p\\/'];

// server will use this cookie to store identity token
ApiCfg.identityCookie = 'tcs';

if (ApiCfg.showConfig) console.log('Config[api]:', JSON.stringify(ApiCfg, undefined, 10));
module.exports = ApiCfg;
