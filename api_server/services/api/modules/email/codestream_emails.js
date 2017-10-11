'use strict';

var SendGrid_Email = require('./sendgrid_email');
var Email_Utils = require('./utils');

class CodeStream_Emails {

	constructor (options) {
		Object.assign(this, options);
		this.sendgrid_email = new SendGrid_Email(this.sendgrid);
	}

	send_confirmation_email (options, callback) {
		let { user, email, request } = options;
		if (request) {
			request.log(`Sending confirmation email to ${email}`);
		}
		const name = Email_Utils.get_user_name(user);
		const subject = `Welcome to CodeStream, ${name}`;
		this.sendgrid_email.send_email(
			{
				from: this.sender_email,
				to: email,
				subject: subject,
				fields: {
					code: user.confirmation_code,
					name: name
				},
				template_id: this.confirmation_email_template_id,
				request: request
			},
			callback
		);
	}
}

module.exports = CodeStream_Emails;
