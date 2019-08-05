// gitlab integration configuration

'use strict';

/* eslint no-console: 0 */

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

let GitLabCfg = {
	appClientId: null,
	appClientSecret: null
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('apiServer.showConfig');
	let gitlabProviders = CfgData.getSection('integrations.gitlab');
	if (gitlabProviders['gitlab.com']) {
		GitLabCfg = gitlabProviders['gitlab.com'];
	}
}
else {
	GitLabCfg.appClientId = process.env.CS_API_GITLAB_CLIENT_ID;
	GitLabCfg.appClientSecret = process.env.CS_API_GITLAB_CLIENT_SECRET;
}

if (ShowCfg) console.log('Config[gitlab]:', JSON.stringify(GitLabCfg, undefined, 10));
module.exports = GitLabCfg;
