// provides a class through which to send particular email types

'use strict';

var SendGridEmail = require('./sendgrid_email');
var EmailUtils = require('./utils');

class CodeStreamEmails {

	constructor (options) {
		Object.assign(this, options);
		this.sendgridEmail = new SendGridEmail(this.sendgrid);
	}

	// send a confirmation email to the user specified
	sendConfirmationEmail (options, callback) {
		let { user, email, request } = options;
		if (request) {
			request.log(`Sending confirmation email to ${email}`);
		}
		const name = EmailUtils.getUserName(user);	// glean a user name from attributes defined for the user
		const subject = `Welcome to CodeStream, ${name}`;
		// let SendGrid handle sending the email, they have a confirmation email template
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
