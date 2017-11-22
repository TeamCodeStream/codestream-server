'use strict';

module.exports = {
	sendgrid: {
		url: '/v3/mail/send',
		apiKey: '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',
		emailTo: process.env.CS_API_EMAIL_TO
	},
	senderEmail: 'alerts@codestream.com',	 
	confirmationEmailTemplateId: '300934c5-3a9c-46f8-a905-b801c23439ab',
};
