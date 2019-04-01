// asana integration configuration

'use strict';

let AsanaCfg = {};
if (process.env.CS_API_CFG_FILE) {
	AsanaCfg = require(process.env.CS_API_CFG_FILE).integrations.asana['asana.com'];
}
else {
	AsanaCfg.appClientId = process.env.CS_API_ASANA_CLIENT_ID;
	AsanaCfg.appClientSecret = process.env.CS_API_ASANA_CLIENT_SECRET;
}

module.exports = AsanaCfg;
