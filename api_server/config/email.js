// email configuration

'use strict';

module.exports = {
	sendgrid: {	// sendgrid credentials
		url: '/v3/mail/send',
		apiKey: process.env.CS_API_SENDGRID_SECRET || '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',
		emailTo: process.env.CS_API_EMAIL_TO // redirect emails to this address, for safe testing
	},
	senderEmail: process.env.CS_API_SENDER_EMAIL || 'alerts@codestream.com', // we'll send emails from this address
	replyToDomain: process.env.CS_API_REPLY_TO_DOMAIN || 'dev.codestream.com',	// reply to will be like <streamId>@dev.codestream.com
	notificationInterval: process.env.CS_API_EMAIL_NOTIFICATION_INTERVAL || 300000, // how often email notifications will be sent per stream
	maxPostsPerEmail: 25,	// maximum number of posts to send in an email notification
	confirmationEmailTemplateId: '300934c5-3a9c-46f8-a905-b801c23439ab', // template to use for confirmation emails
	newUserInviteEmailTemplateId: '288e638c-c9f2-4cc3-adcb-d74333cfe190', // template to use for invite emails to new users
	registeredUserInviteEmailTemplateId: '54dfad87-c9fb-42ba-8036-5a789ce30d89',	// template to use for invite emails to already registered users
	alreadyRegisteredEmailTemplateId: '7f9366c5-bb71-4acc-816e-f57ed23c08d6'	// template to use when a user is attempting to register but they are already registered
};
