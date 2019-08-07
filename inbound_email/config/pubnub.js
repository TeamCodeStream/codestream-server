// pubnub configuration

'use strict';

/* eslint no-console: 0 */

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let PubnubCfg = {};
let ShowCfg = process.env.CS_MAILIN_SHOW_CFG || false;

let CfgFileName = process.env.CS_MAILIN_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('inboundEmailServer.showConfig');
	PubnubCfg = CfgData.getSection('broadcastEngine.pubnub');
}
else {
	PubnubCfg = {
		subscribeKey: process.env.CS_MAILIN_PUBNUB_SUBSCRIBE_KEY,
		ssl: true
	};
}

if (ShowCfg) console.log('Config[pubnub]:', JSON.stringify(PubnubCfg, undefined, 10));
module.exports = PubnubCfg;
