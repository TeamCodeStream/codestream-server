// Glip integration configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const IntercomCfg = {
	accessToken: CfgData.getProperty('telemetry.intercom.token')
};

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[intercom]:', JSON.stringify(IntercomCfg, undefined, 10));
module.exports = IntercomCfg;
