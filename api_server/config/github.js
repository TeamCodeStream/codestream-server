// github integration configuration

'use strict';

let GitHubCfg = {};
GitHubCfg['localProviders'] = {};

if (process.env.CS_API_CFG_FILE) {
	let AllGitHubCfgs = require(process.env.CS_API_CFG_FILE).integrations.github;
	Object.keys(AllGitHubCfgs).forEach(gitHubService => {
		if (gitHubService === 'github.com') {
			GitHubCfg.appClientId = AllGitHubCfgs['github.com'].appClientId;
			GitHubCfg.appClientSecret = AllGitHubCfgs['github.com'].appClientSecret;
		}
		else {
			GitHubCfg.localProviders[gitHubService] = AllGitHubCfgs[gitHubService];
		}
	});
}
else {
	GitHubCfg.appClientId = process.env.CS_API_GITHUB_CLIENT_ID;
	GitHubCfg.appClientSecret = process.env.CS_API_GITHUB_CLIENT_SECRET;
	if (process.env.CS_API_GITHUB_ENTERPRISE_SERVER) {
		GitHubCfg.localProviders[process.env.CS_API_GITHUB_ENTERPRISE_SERVER] = {
			appClientId: process.env.CS_API_GITHUB_ENTERPRISE_CLIENT_ID,
			appClientSecret: process.env.CS_API_GITHUB_ENTERPRISE_CLIENT_SECRET
		};
	}
}

module.exports = GitHubCfg;
