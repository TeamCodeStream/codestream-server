// gitlab integration configuration

'use strict';

let GitLabCfg = {};
if (process.env.CS_API_CFG_FILE) {
	GitLabCfg = require(process.env.CS_API_CFG_FILE).integrations.gitlab['gitlab.com'];
}
else {
	GitLabCfg.appClientId = process.env.CS_API_GITLAB_CLIENT_ID;
	GitLabCfg.appClientSecret = process.env.CS_API_GITLAB_CLIENT_SECRET;
}

module.exports = GitLabCfg;
