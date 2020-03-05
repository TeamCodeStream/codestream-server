'use strict';

// Low-level config data loader can source a configuration from a file or mongo
// database.

/* eslint no-console: 0 */

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
let CfgOpts;
if (CfgFileName) {
	CfgOpts = { configFile: CfgFileName };
}
else if (process.env.CSSVC_CFG_URL) {
	CfgOpts = { mongoUrl: process.env.CSSVC_CFG_URL };
}
else {
	console.log('no configuration provided. Set CSSVC_CFG_FILE or CSSVC_CFG_URL.');
	process.exit(1);
}
module.exports = new StructuredCfgFile(CfgOpts);
