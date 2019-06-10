// YouTrack integration configuration

'use strict';

let YouTrackCfg = {};
if (process.env.CS_API_CFG_FILE) {
	YouTrackCfg = (require(process.env.CS_API_CFG_FILE).integrations.youtrack || {})['youtrack.com'];
}
else {
	YouTrackCfg.appClientId = 'placeholder';
}

module.exports = YouTrackCfg;
