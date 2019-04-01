// email configuration

'use strict';

let EmailCfg = {};
if (process.env.CS_API_CFG_FILE) {
	EmailCfg = require(process.env.CS_API_CFG_FILE).email;
}
else {
	EmailCfg.replyToDomain = process.env.CS_API_REPLY_TO_DOMAIN || 'dev.codestream.com';	// reply to will be like <streamId>@dev.codestream.com
	EmailCfg.notificationInterval = parseInt(process.env.CS_API_EMAIL_NOTIFICATION_INTERVAL || 300000, 10); // how often email notifications will be sent per stream
	EmailCfg.suppressEmails = process.env.CS_API_SUPPRESS_EMAILS === 'undefined' ? true : process.env.CS_API_SUPPRESS_EMAILS; // suppress outbound email sends
}

module.exports = EmailCfg;
