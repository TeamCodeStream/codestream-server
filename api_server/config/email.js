// email configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const EmailCfg = CfgData.getSection('email');
if (!Object.keys(EmailCfg).length) {
	EmailCfg.inboundEmailDisabled = true;
}
else {
	EmailCfg.inboundEmailDisabled = CfgData.getProperty('inboundEmailServer.inboundEmailDisabled');
}

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[email]:', JSON.stringify(EmailCfg, undefined, 10));
module.exports = EmailCfg;
