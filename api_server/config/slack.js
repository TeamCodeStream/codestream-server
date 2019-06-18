// slack integration configuration

'use strict';
let SlackCfg = {};
if (process.env.CS_API_CFG_FILE) {
	SlackCfg = require(process.env.CS_API_CFG_FILE).integrations.slack['slack.com'];
}
else {
	SlackCfg.appClientId = process.env.CS_API_SLACK_CLIENT_ID;
	SlackCfg.appClientSecret = process.env.CS_API_SLACK_CLIENT_SECRET;
	SlackCfg.appStrictClientId = process.env.CS_API_SLACK_STRICT_CLIENT_ID;
	SlackCfg.appStrictClientSecret = process.env.CS_API_SLACK_STRICT_CLIENT_SECRET;
}

module.exports = SlackCfg;
