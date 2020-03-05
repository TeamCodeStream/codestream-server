// Glip integration configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const GlipCfg = CfgData.getSection('integrations.glip.cloud') || {appClientId: null, appClientSecret: null};

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[glip]:', JSON.stringify(GlipCfg, undefined, 10));
module.exports = GlipCfg;
