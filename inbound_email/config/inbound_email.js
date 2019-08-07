// general inbound email server configuration

'use strict';

/* eslint no-console: 0 */

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let EmailCfg = {};

let CfgFileName = process.env.CS_MAILIN_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	EmailCfg = CfgData.getSection('inboundEmailServer');
	EmailCfg.replyToDomain = CfgData.getProperty('email.replyToDomain');
	EmailCfg.senderEmail = CfgData.getProperty('email.senderEmail');
}
else {
	EmailCfg = {
		inboundEmailDirectory: process.env.CS_MAILIN_DIRECTORY,
		processDirectory: process.env.CS_MAILIN_PROCESS_DIRECTORY,
		tempAttachmentDirectory: process.env.CS_MAILIN_TEMP_ATTACHMENT_DIRECTORY,
		replyToDomain: process.env.CS_MAILIN_REPLY_TO_DOMAIN || 'dev.codestream.com',	// reply to will be like <streamId>@dev.codestream.com
		senderEmail: process.env.CS_MAILIN_SENDER_EMAIL, // emails from our system are sent from this address
		showConfig: process.env.CS_MAILIN_SHOW_CFG || false
	};
}

if (EmailCfg.showConfig) console.log('Config[inbound_email]:', JSON.stringify(EmailCfg, undefined, 10));
module.exports = EmailCfg;
