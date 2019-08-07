// secrets, never let these out beyond the server!!!

'use strict';

/* eslint no-console: 0 */

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let SecretsCfg = {};
let ShowCfg = process.env.CS_MAILIN_SHOW_CFG || false;

let CfgFileName = process.env.CS_MAILIN_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('inboundEmailServer.showConfig');
	SecretsCfg = {
		mailSecret: CfgData.getProperty('sharedSecrets.mail'),
		confirmationCheat: CfgData.getProperty('sharedSecrets.confirmationCheat')
	};
}
else {
	SecretsCfg = {
		mailSecret: process.env.CS_MAILIN_SECRET, // for internal comms with API server
		confirmationCheat: process.env.CS_MAILIN_CONFIRMATION_CHEAT_CODE	// for bypassing email confirmation, used for unit testing
	};
}

if (ShowCfg) console.log('Config[secrets]:', JSON.stringify(SecretsCfg, undefined, 10));
module.exports = SecretsCfg;
