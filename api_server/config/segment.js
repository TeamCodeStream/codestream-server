// segment (analytics) configuration

'use strict';

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');

let SegmentCfg = {};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	SegmentCfg = CfgData.getSection('telemetry.segment');
}
else {
	SegmentCfg = {
		token: process.env.CS_API_SEGMENT_TOKEN,
		webToken: process.env.CS_API_SEGMENT_WEB_TOKEN
	};
}

if (process.env.CS_API_SHOW_CFG) console.log('Config[segment]:', SegmentCfg);
module.exports = SegmentCfg;
