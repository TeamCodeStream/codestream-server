// Glip integration configuration

'use strict';

let IntercomCfg = {};
if (process.env.CS_API_CFG_FILE) {
	IntercomCfg.accessToken = require(process.env.CS_API_CFG_FILE).telemetry.intercom.token;
}
else {
	IntercomCfg.accessToken = process.env.CS_API_INTERCOM_ACCESS_TOKEN;
}

module.exports = IntercomCfg;
