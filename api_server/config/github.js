// github integration configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const GithubProviders = CfgData.getSection('integrations.github');
const GitHubCfg = GithubProviders.cloud;
Object.keys(GithubProviders).forEach(provider => {
	if (provider != 'cloud') {
		GitHubCfg.localProviders[provider] = GithubProviders[provider];
	}
});

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[github]:', JSON.stringify(GitHubCfg, undefined, 10));
module.exports = GitHubCfg;
