// github integration configuration

'use strict';

const structuredCfgFile = require('../codestream-configs/lib/structured_config');

let GitHubCfg = {
	appClientId: null,
	appClientSecret: null,
	localProviders: {}
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new structuredCfgFile({ configFile: CfgFileName });
	let githubProviders = CfgData.getSection('integrations.github');
	Object.keys(githubProviders).forEach(provider => {
		if (provider == 'github.com') {
			GitHubCfg.appClientId = githubProviders['github.com'].appClientId;
			GitHubCfg.appClientSecret = githubProviders['github.com'].appClientSecret;
		}
		else {
			GitHubCfg.localProviders[provider] = githubProviders[provider];
		}
	});
}
else {
	GitHubCfg.appClientId = process.env.CS_API_GITHUB_CLIENT_ID;
	GitHubCfg.appClientSecret = process.env.CS_API_GITHUB_CLIENT_SECRET;
}

if (process.env.CS_API_SHOW_CFG) console.log('Config[github]:', GitHubCfg);
module.exports = GitHubCfg;
