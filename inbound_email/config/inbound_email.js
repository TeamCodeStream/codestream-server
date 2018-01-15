// general inbound email server configuration

'use strict';

module.exports = {
	inboundEmailDirectory: process.env.CS_MAILIN_DIRECTORY,
	processDirectory: process.env.CS_MAILIN_PROCESS_DIRECTORY,
	tempAttachmentDirectory: process.env.CS_MAILIN_TEMP_ATTACHMENT_DIRECTORY,
	replyToDomain: process.env.CS_MAILIN_REPLY_TO_DOMAIN || 'dev.codestream.com',	// reply to will be like <streamId>@dev.codestream.com
	senderEmail: process.env.CS_MAILIN_SENDER_EMAIL // emails from our system are sent from this address
};
