// segment (analytics) configuration

'use strict';

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

let SegmentCfg = {};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('apiServer.showConfig');
	SegmentCfg = CfgData.getSection('telemetry.segment');
}
else {
	SegmentCfg = {
		token: process.env.CS_API_SEGMENT_TOKEN,
		webToken: process.env.CS_API_SEGMENT_WEB_TOKEN
	};
}

if (ShowCfg) console.log('Config[segment]:', JSON.stringify(SegmentCfg, undefined, 10));
module.exports = SegmentCfg;
