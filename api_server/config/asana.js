// asana integration configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const AsanaCfg = CfgData.getSection('integrations.asana.cloud') || {appClientId: null, appClientSecret: null};

if (CfgData.getProperty('apiServer.showConfig')) {
	console.log('Config[asana]:', JSON.stringify(AsanaCfg, undefined, 10));
}
module.exports = AsanaCfg;
