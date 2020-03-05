// YouTrack integration configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const YouTrackCfg = CfgData.getSection('integrations.youtrack.cloud') || {
	// this is needed to be non-null to return provider data to the client, but is not actually used
	appClientId: 'placeholder',
	appClientSecret: null
};
if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[youtrack]:', JSON.stringify(YouTrackCfg, undefined, 10));
module.exports = YouTrackCfg;
