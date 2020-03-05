// trello integration configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const TrelloCfg = CfgData.getSection('integrations.trello.cloud') || {apiKey: null};

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[trello]:', JSON.stringify(TrelloCfg, undefined, 10));
module.exports = TrelloCfg;
