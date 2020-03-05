// secrets, never let these out beyond the server!!!

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const SecretsCfg = CfgData.getSection('sharedSecrets');
SecretsCfg.broadcaster = CfgData.getProperty('broadcastEngine.codestreamBroadcaster.secrets.api');

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[secrets]:', JSON.stringify(SecretsCfg, undefined, 10));
module.exports = SecretsCfg;
