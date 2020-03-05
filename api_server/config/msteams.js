// MSTeams integration configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const MsTeamsCfg = CfgData.getSection('integrations.msteams.cloud') || {
	appClientId: null,
	appClientSecret: null,
	botAppId: null,
	botAppPassword: null
};

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[msteams]:', JSON.stringify(MsTeamsCfg, undefined, 10));
module.exports = MsTeamsCfg;
