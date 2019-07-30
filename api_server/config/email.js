// email configuration

'use strict';

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');

let EmailCfg = {
	replyToDomain: null,
	notificationInterval: null,
	suppressEmails: null,
	inboundEmailDisabled: null
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	EmailCfg = CfgData.getSection('email');
	if (!Object.keys(EmailCfg).length) {
		EmailCfg.inboundEmailDisabled = true;
	}
	else {
		EmailCfg.inboundEmailDisabled = CfgData.getProperty('inboundEmailServer.inboundEmailDisabled');
	}
}
else {
	EmailCfg.replyToDomain = process.env.CS_API_REPLY_TO_DOMAIN;	// reply to will be like <streamId>@dev.codestream.com
	EmailCfg.notificationInterval = parseInt(process.env.CS_API_EMAIL_NOTIFICATION_INTERVAL || 300000, 10); // how often email notifications will be sent per stream
	EmailCfg.suppressEmails = process.env.CS_API_SUPPRESS_EMAILS === 'undefined' ? true : process.env.CS_API_SUPPRESS_EMAILS; // suppress outbound email sends
	EmailCfg.inboundEmailDisabled = process.env.CS_API_INBOUND_EMAIL_DISABLED;	// don't allow inbound emails
}

if (process.env.CS_API_SHOW_CFG) console.log('Config[email]:', EmailCfg);
module.exports = EmailCfg;
