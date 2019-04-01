// segment (analytics) configuration

'use strict';

let SegmentCfg = {};
if (process.env.CS_API_CFG_FILE) {
	SegmentCfg = require(process.env.CS_API_CFG_FILE).segment;
}
else {
	SegmentCfg = {
		token: process.env.CS_API_SEGMENT_TOKEN,
		webToken: process.env.CS_API_SEGMENT_WEB_TOKEN
	};
}

module.exports = SegmentCfg;
