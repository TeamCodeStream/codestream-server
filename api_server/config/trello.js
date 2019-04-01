// trello integration configuration

'use strict';

let TrelloCfg = {};
if (process.env.CS_API_CFG_FILE) {
	TrelloCfg = require(process.env.CS_API_CFG_FILE).integrations.trello['trello.com'];
}
else {
	TrelloCfg.apiKey = process.env.CS_API_TRELLO_API_KEY;
}

module.exports = TrelloCfg;
