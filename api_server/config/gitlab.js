// gitlab integration configuration

'use strict';

const structuredCfgFile = require('../codestream-configs/lib/structured_config');

let GitLabCfg = {
	appClientId: null,
	appClientSecret: null
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new structuredCfgFile({ configFile: CfgFileName });
	let gitlabProviders = CfgData.getSection('integrations.gitlab');
	if (gitlabProviders['gitlab.com']) {
		GitLabCfg = gitlabProviders['gitlab.com'];
	}
}
else {
	GitLabCfg.appClientId = process.env.CS_API_GITLAB_CLIENT_ID;
	GitLabCfg.appClientSecret = process.env.CS_API_GITLAB_CLIENT_SECRET;
}

if (process.env.CS_API_SHOW_CFG) console.log('Config[gitlab]:', GitLabCfg);
module.exports = GitLabCfg;
