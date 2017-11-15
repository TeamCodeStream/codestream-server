'use strict';

var SendGridEmail = require('./sendgrid_email');
var EmailUtils = require('./utils');

class CodeStreamEmails {

	constructor (options) {
		Object.assign(this, options);
		this.sendgridEmail = new SendGridEmail(this.sendgrid);
	}

	sendConfirmationEmail (options, callback) {
		let { user, email, request } = options;
		if (request) {
			request.log(`Sending confirmation email to ${email}`);
		}
		const name = EmailUtils.getUserName(user);
		const subject = `Welcome to CodeStream, ${name}`;
		this.sendgridEmail.sendEmail(
			{
				from: this.senderEmail,
				to: email,
				subject: subject,
				fields: {
					code: user.confirmationCode,
					name: name
				},
				templateId: this.confirmationEmailTemplateId,
				request: request
			},
			callback
		);
	}
}

module.exports = CodeStreamEmails;
