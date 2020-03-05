// gitlab integration configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const GitLabCfg = CfgData.getSection('integrations.gitlab.cloud') || {appClientId: null, appClientSecret: null};

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[gitlab]:', JSON.stringify(GitLabCfg, undefined, 10));
module.exports = GitLabCfg;
