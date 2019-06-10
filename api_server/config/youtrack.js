// YouTrack integration configuration

'use strict';

let YouTrackCfg = {};
if (process.env.CS_API_CFG_FILE) {
	YouTrackCfg = (require(process.env.CS_API_CFG_FILE).integrations.youtrack || {})['youtrack.com'];
}
else {
	// this is needed to be non-null to return provider data to the client, but is not actually used
	YouTrackCfg.appClientId = 'placeholder';
}

module.exports = YouTrackCfg;
