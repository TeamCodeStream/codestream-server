// pubnub configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const PubnubCfg = CfgData.getSection('broadcastEngine.pubnub');

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[pubnub]:', JSON.stringify(PubnubCfg, undefined, 10));
module.exports = PubnubCfg;
