// secrets, never let these out beyond the server!!!

'use strict';

const structuredCfgFile = require('../codestream-configs/lib/structured_config');

let SecretsCfg = {};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new structuredCfgFile({ configFile: CfgFileName });
	SecretsCfg = CfgData.getSection('sharedSecrets');
	SecretsCfg.broadcaster = CfgData.getProperty('broadcastEngine.broadcaster.secrets.api');
}
else {
	SecretsCfg = {
		auth: process.env.CS_API_AUTH_SECRET,	// for authentication
		cookie: process.env.CS_API_COOKIE_SECRET,	// for cookie authentication
		confirmationCheat: process.env.CS_API_CONFIRMATION_CHEAT_CODE,	// for bypassing email confirmation, used for unit testing
		subscriptionCheat: process.env.CS_API_SUBSCRIPTION_CHEAT_CODE,	// for allowing unregistered users to subscribe to their me-channel, for testing emails
		mail: process.env.CS_API_INBOUND_EMAIL_SECRET, // used to verify requests from inbound email server
		telemetry: process.env.CS_API_PRE_AUTH_SECRET, // used to fetch the telemetry token (hard-coded into the agent, kind of blech)
		broadcaster: process.env.CS_API_BROADCASTER_SECRET	// used to communicate with the broadcaster service
	};
}

if (process.env.CS_API_SHOW_CFG) console.log('Config[secrets]:', SecretsCfg);
module.exports = SecretsCfg;
