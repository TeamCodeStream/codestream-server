// asana integration configuration

'use strict';

let JiraCfg = {};
if (process.env.CS_API_CFG_FILE) {
	JiraCfg = require(process.env.CS_API_CFG_FILE).integrations.jira['atlassian.com'];
}
else {
	JiraCfg.appClientId = process.env.CS_API_JIRA_CLIENT_ID;
	JiraCfg.appClientSecret = process.env.CS_API_JIRA_SECRET;
}

module.exports = JiraCfg;
